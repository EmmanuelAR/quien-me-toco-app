use snforge_std::{
    ContractClassTrait, DeclareResultTrait, declare, start_cheat_block_timestamp_global,
    start_cheat_caller_address, stop_cheat_caller_address,
};
use starknet::ContractAddress;
use quien_me_toco::{IQuienMeTocoDispatcher, IQuienMeTocoDispatcherTrait, Wishlist};

pub const EVENT_AT: u64 = 1_800_000_000; // una fecha cualquiera en el futuro
pub const INVITE: felt252 = 'secreto';

pub fn owner() -> ContractAddress {
    'owner'.try_into().unwrap()
}
pub fn operator() -> ContractAddress {
    'operator'.try_into().unwrap()
}
pub fn admin() -> ContractAddress {
    'admin'.try_into().unwrap()
}
pub fn ana() -> ContractAddress {
    'ana'.try_into().unwrap()
}
pub fn beto() -> ContractAddress {
    'beto'.try_into().unwrap()
}
pub fn carla() -> ContractAddress {
    'carla'.try_into().unwrap()
}
pub fn dani() -> ContractAddress {
    'dani'.try_into().unwrap()
}
pub fn stranger() -> ContractAddress {
    'stranger'.try_into().unwrap()
}

pub fn wishlist(ideas: ByteArray) -> Wishlist {
    Wishlist { ideas, sizes: "", links: "" }
}

pub fn deploy() -> IQuienMeTocoDispatcher {
    let contract = declare("QuienMeToco").unwrap().contract_class();
    let mut calldata: Array<felt252> = array![];
    calldata.append(owner().into());
    calldata.append(operator().into());
    let (address, _) = contract.deploy(@calldata).unwrap();
    // el "ahora" de los tests: un mes antes del intercambio
    start_cheat_block_timestamp_global(EVENT_AT - 30 * 86400);
    IQuienMeTocoDispatcher { contract_address: address }
}

pub fn as_caller(c: IQuienMeTocoDispatcher, who: ContractAddress) {
    start_cheat_caller_address(c.contract_address, who);
}

pub fn stop(c: IQuienMeTocoDispatcher) {
    stop_cheat_caller_address(c.contract_address);
}

/// grupo de 4 creado por la admin, sin participantes todavía
pub fn create_group(c: IQuienMeTocoDispatcher, expected: u32) -> u64 {
    as_caller(c, admin());
    let id = c
        .create_group(
            "navidad", EVENT_AT, "casa de la abuela", 5000, 10000, 'CRC', "", expected, INVITE, 0,
        );
    stop(c);
    id
}

pub fn join(c: IQuienMeTocoDispatcher, group_id: u64, who: ContractAddress, name: ByteArray, pubkey: u256) -> u32 {
    as_caller(c, who);
    let idx = c.join(group_id, INVITE, name, pubkey, 777, wishlist("algo"));
    stop(c);
    idx
}

/// grupo de 4 con ana, beto, carla y la abuela (sin cuenta); listo para sortear
pub fn full_group(c: IQuienMeTocoDispatcher) -> u64 {
    let id = create_group(c, 4);
    join(c, id, ana(), "ana", 1);
    join(c, id, beto(), "beto", 2);
    join(c, id, carla(), "carla", 3);
    as_caller(c, admin());
    c.add_ghost(id, "abuela", wishlist("un nieto que la visite"));
    stop(c);
    id
}

pub fn ciphertexts(n: u32) -> Array<ByteArray> {
    let mut out: Array<ByteArray> = array![];
    let mut i: u32 = 0;
    while i < n {
        out.append("cifrado");
        i += 1;
    }
    out
}
