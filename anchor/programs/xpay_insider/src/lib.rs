use anchor_lang::prelude::*;

declare_id!("4mq4iCgb1wh8t2AXEd2qP8Gw2qrNgy5Avinte9yNLQCc"); // placeholder, will be replaced after build

#[program]
pub mod xpay_insider {
    use super::*;

    /// Register an insider review on-chain.
    /// Stores metadata + review content hash. The full review text lives off-chain.
    pub fn register_review(
        ctx: Context<RegisterReview>,
        company_id: String,
        role: String,
        price_lamports: u64,
        review_hash: [u8; 32],
        verified: bool,
    ) -> Result<()> {
        require!(company_id.len() <= 32, XPayError::StringTooLong);
        require!(role.len() <= 64, XPayError::StringTooLong);
        require!(price_lamports > 0, XPayError::InvalidPrice);

        let review = &mut ctx.accounts.review;
        review.author = ctx.accounts.author.key();
        review.company_id = company_id;
        review.role = role;
        review.price_lamports = price_lamports;
        review.review_hash = review_hash;
        review.verified = verified;
        review.timestamp = Clock::get()?.unix_timestamp;
        review.bump = ctx.bumps.review;

        emit!(ReviewRegistered {
            author: review.author,
            company_id: review.company_id.clone(),
            role: review.role.clone(),
            price_lamports: review.price_lamports,
            review_hash: review.review_hash,
            verified: review.verified,
            timestamp: review.timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(company_id: String, role: String)]
pub struct RegisterReview<'info> {
    #[account(
        init,
        payer = author,
        space = ReviewAccount::space(&company_id, &role),
        seeds = [
            b"review",
            author.key().as_ref(),
            company_id.as_bytes(),
        ],
        bump,
    )]
    pub review: Account<'info, ReviewAccount>,

    #[account(mut)]
    pub author: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct ReviewAccount {
    /// The insider's wallet address (receives 70% of unlock payments)
    pub author: Pubkey,        // 32
    /// Company identifier (e.g. "nvidia", "google")
    pub company_id: String,    // 4 + len
    /// Role at the company
    pub role: String,          // 4 + len
    /// Price in lamports to unlock this review
    pub price_lamports: u64,   // 8
    /// SHA-256 hash of the full review content
    pub review_hash: [u8; 32], // 32
    /// Whether the insider verified their company email
    pub verified: bool,        // 1
    /// Unix timestamp of registration
    pub timestamp: i64,        // 8
    /// PDA bump seed
    pub bump: u8,              // 1
}

impl ReviewAccount {
    pub fn space(company_id: &str, role: &str) -> usize {
        8  // discriminator
        + 32 // author
        + 4 + company_id.len() // company_id (String: 4 bytes len + content)
        + 4 + role.len()       // role
        + 8  // price_lamports
        + 32 // review_hash
        + 1  // verified
        + 8  // timestamp
        + 1  // bump
    }
}

#[event]
pub struct ReviewRegistered {
    pub author: Pubkey,
    pub company_id: String,
    pub role: String,
    pub price_lamports: u64,
    pub review_hash: [u8; 32],
    pub verified: bool,
    pub timestamp: i64,
}

#[error_code]
pub enum XPayError {
    #[msg("String exceeds maximum length")]
    StringTooLong,
    #[msg("Price must be greater than zero")]
    InvalidPrice,
}
