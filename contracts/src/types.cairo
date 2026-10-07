use starknet::ContractAddress;

/// estados del grupo
pub mod status {
    pub const OPEN: u8 = 0;
    pub const CLOSED: u8 = 1;
    pub const DRAW_REQUESTED: u8 = 2;
    pub const DRAWN: u8 = 3;
    pub const REVEAL_REQUESTED: u8 = 4;
    pub const REVEALED: u8 = 5;
}

#[derive(Drop, Serde, Clone, PartialEq, starknet::Store)]
pub struct Group {
    pub admin: ContractAddress,
    pub name: ByteArray,
    /// unix seconds (utc)
    pub event_at: u64,
    pub place: ByteArray,
    pub budget_min: u32,
    pub budget_max: u32,
    /// short string, ej. 'CRC'
    pub currency: felt252,
    pub rules: ByteArray,
    /// cuántos son (incluye a los sin cuenta)
    pub expected_count: u32,
    /// secreto débil del link de invitación
    pub invite_code: felt252,
    /// 0 si el grupo es nuevo
    pub previous_group_id: u64,
    /// que no te toque la misma persona del año pasado
    pub avoid_previous: bool,
    pub status: u8,
    pub drawn_at: u64,
    pub revealed_at: u64,
}

#[derive(Drop, Serde, Clone, PartialEq, starknet::Store)]
pub struct Participant {
    /// 0 si es sin cuenta
    pub account: ContractAddress,
    pub name: ByteArray,
    /// llave pública x25519 (32 bytes). sin cuenta → la del servidor
    pub enc_pubkey: u256,
    /// sha256(correo || ":" || nonce). 0 si sin cuenta
    pub email_commit: u256,
    pub is_ghost: bool,
}

#[derive(Drop, Serde, Clone, PartialEq, starknet::Store)]
pub struct Wishlist {
    pub ideas: ByteArray,
    pub sizes: ByteArray,
    /// uno por línea
    pub links: ByteArray,
}

/// exclusión bidireccional entre dos índices
#[derive(Drop, Serde, Copy, PartialEq, starknet::Store)]
pub struct Exclusion {
    pub a: u32,
    pub b: u32,
}
