use starknet::ContractAddress;
use super::types::{Exclusion, Group, Participant, Wishlist};

#[starknet::interface]
pub trait IQuienMeToco<TContractState> {
    // ---- admin (caller == group.admin) ----
    fn create_group(
        ref self: TContractState,
        name: ByteArray,
        event_at: u64,
        place: ByteArray,
        budget_min: u32,
        budget_max: u32,
        currency: felt252,
        rules: ByteArray,
        expected_count: u32,
        invite_code: felt252,
        previous_group_id: u64,
    ) -> u64;
    /// copia metadata y participantes sin cuenta de un grupo ya revelado; activa avoid_previous
    fn clone_group(
        ref self: TContractState, previous_group_id: u64, event_at: u64, invite_code: felt252,
    ) -> u64;
    fn update_group(
        ref self: TContractState,
        group_id: u64,
        name: ByteArray,
        event_at: u64,
        place: ByteArray,
        budget_min: u32,
        budget_max: u32,
        rules: ByteArray,
    );
    fn set_expected_count(ref self: TContractState, group_id: u64, count: u32);
    fn close_registrations(ref self: TContractState, group_id: u64);
    fn reopen_registrations(ref self: TContractState, group_id: u64);
    fn set_exclusions(ref self: TContractState, group_id: u64, pairs: Array<Exclusion>);
    fn set_avoid_previous(ref self: TContractState, group_id: u64, enabled: bool);
    fn add_ghost(ref self: TContractState, group_id: u64, name: ByteArray, wishlist: Wishlist) -> u32;
    fn remove_participant(ref self: TContractState, group_id: u64, index: u32);
    fn request_draw(ref self: TContractState, group_id: u64);
    fn cancel_draw_request(ref self: TContractState, group_id: u64);
    fn request_reveal(ref self: TContractState, group_id: u64);
    /// apaga el grupo. sigue en la cadena, la app lo esconde.
    fn set_archived(ref self: TContractState, group_id: u64, archived: bool);

    // ---- participante (caller == participant.account) ----
    fn join(
        ref self: TContractState,
        group_id: u64,
        invite_code: felt252,
        name: ByteArray,
        enc_pubkey: u256,
        email_commit: u256,
        wishlist: Wishlist,
    ) -> u32;
    fn update_wishlist(ref self: TContractState, group_id: u64, index: u32, wishlist: Wishlist);
    fn rotate_enc_pubkey(ref self: TContractState, group_id: u64, index: u32, new_pubkey: u256);

    // ---- servidor (caller == operator) ----
    fn publish_draw(
        ref self: TContractState,
        group_id: u64,
        commitments: Array<felt252>,
        ciphertexts: Array<ByteArray>,
        sealed_reveal: ByteArray,
    );
    fn update_ciphertext(ref self: TContractState, group_id: u64, index: u32, ciphertext: ByteArray);
    fn reveal(ref self: TContractState, group_id: u64, receivers: Array<u32>, salts: Array<felt252>);

    // ---- dueño del contrato ----
    fn set_operator(ref self: TContractState, operator: ContractAddress);

    // ---- lecturas ----
    fn get_operator(self: @TContractState) -> ContractAddress;
    fn get_group(self: @TContractState, group_id: u64) -> Group;
    fn is_archived(self: @TContractState, group_id: u64) -> bool;
    fn get_participant_count(self: @TContractState, group_id: u64) -> u32;
    fn get_participant(self: @TContractState, group_id: u64, index: u32) -> Participant;
    fn get_participants(self: @TContractState, group_id: u64) -> Array<Participant>;
    fn get_participant_index(
        self: @TContractState, group_id: u64, account: ContractAddress,
    ) -> Option<u32>;
    fn get_wishlist(self: @TContractState, group_id: u64, index: u32) -> Wishlist;
    fn get_exclusions(self: @TContractState, group_id: u64) -> Array<Exclusion>;
    fn get_ciphertext(self: @TContractState, group_id: u64, index: u32) -> ByteArray;
    fn get_commitments(self: @TContractState, group_id: u64) -> Array<felt252>;
    fn get_sealed_reveal(self: @TContractState, group_id: u64) -> ByteArray;
    /// (receivers, salts); vacíos si todavía no se reveló
    fn get_reveal(self: @TContractState, group_id: u64) -> (Array<u32>, Array<felt252>);
    /// (versión de la llave, versión del cifrado) para saber si hay que re-cifrar
    fn get_key_versions(self: @TContractState, group_id: u64, index: u32) -> (u32, u32);
    fn groups_of_admin(self: @TContractState, account: ContractAddress) -> Array<u64>;
    fn groups_of_participant(self: @TContractState, account: ContractAddress) -> Array<u64>;
    fn verify_commitment(
        self: @TContractState, group_id: u64, index: u32, receiver: u32, salt: felt252,
    ) -> bool;
}
