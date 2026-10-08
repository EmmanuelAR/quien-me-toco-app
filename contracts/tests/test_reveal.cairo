use quien_me_toco::quien_me_toco::QuienMeToco::commitment_of;
use quien_me_toco::{Exclusion, IQuienMeTocoDispatcher, IQuienMeTocoDispatcherTrait, status};
use snforge_std::start_cheat_block_timestamp_global;
use super::common::*;

/// permutación 0→1→2→3→0 con salts fijos; devuelve (receivers, salts, commitments)
fn fixture(group_id: u64) -> (Array<u32>, Array<felt252>, Array<felt252>) {
    let receivers: Array<u32> = array![1, 2, 3, 0];
    let salts: Array<felt252> = array![101, 202, 303, 404];
    let mut commitments: Array<felt252> = array![];
    let mut i: u32 = 0;
    while i < 4 {
        commitments.append(commitment_of(group_id, i, *receivers.at(i), *salts.at(i)));
        i += 1;
    }
    (receivers, salts, commitments)
}

/// grupo completo, sorteado y con la revelación pedida por la admin el día del intercambio
fn drawn_group(c: IQuienMeTocoDispatcher) -> (u64, Array<u32>, Array<felt252>) {
    let id = full_group(c);
    let (receivers, salts, commitments) = fixture(id);
    as_caller(c, admin());
    c.request_draw(id);
    stop(c);
    as_caller(c, operator());
    c.publish_draw(id, commitments, ciphertexts(4), "sealed");
    stop(c);
    (id, receivers, salts)
}

fn request_reveal_on_the_day(c: IQuienMeTocoDispatcher, id: u64) {
    start_cheat_block_timestamp_global(EVENT_AT);
    as_caller(c, admin());
    c.request_reveal(id);
    stop(c);
}

#[test]
fn commitment_matches_typescript_vector() {
    // tests/crypto.test.ts: poseidon_hash_span([1, 2, 3, 4])
    let c = commitment_of(1, 2, 3, 4);
    assert(c == 0x26e3ad8b876e02bc8a4fc43dad40a8f81a6384083cabffa190bcf40d512ae1d, 'poseidon vector');
}

#[test]
#[should_panic(expected: 'too early to reveal')]
fn request_reveal_respects_the_date() {
    let c = deploy();
    let (id, _, _) = drawn_group(c);
    // "ahora" sigue siendo un mes antes
    as_caller(c, admin());
    c.request_reveal(id);
}

#[test]
fn request_reveal_allowed_from_a_day_before() {
    let c = deploy();
    let (id, _, _) = drawn_group(c);
    start_cheat_block_timestamp_global(EVENT_AT - 86400);
    as_caller(c, admin());
    c.request_reveal(id);
    assert(c.get_group(id).status == status::REVEAL_REQUESTED, 'requested');
}

#[test]
#[should_panic(expected: 'not admin')]
fn only_admin_requests_reveal() {
    let c = deploy();
    let (id, _, _) = drawn_group(c);
    start_cheat_block_timestamp_global(EVENT_AT);
    as_caller(c, ana());
    c.request_reveal(id);
}

#[test]
#[should_panic(expected: 'not drawn')]
fn request_reveal_needs_a_draw() {
    let c = deploy();
    let id = full_group(c);
    start_cheat_block_timestamp_global(EVENT_AT);
    as_caller(c, admin());
    c.request_reveal(id);
}

#[test]
fn reveal_verifies_and_publishes() {
    let c = deploy();
    let (id, receivers, salts) = drawn_group(c);
    let (r0, s0) = c.get_reveal(id);
    assert(r0.len() == 0 && s0.len() == 0, 'nothing before reveal');
    request_reveal_on_the_day(c, id);
    as_caller(c, operator());
    c.reveal(id, receivers, salts);
    stop(c);
    let g = c.get_group(id);
    assert(g.status == status::REVEALED, 'revealed');
    assert(g.revealed_at == EVENT_AT, 'revealed_at');
    let (r, s) = c.get_reveal(id);
    assert(r.len() == 4 && *r.at(0) == 1 && *r.at(3) == 0, 'receivers');
    assert(*s.at(1) == 202, 'salts');
    assert(c.verify_commitment(id, 0, 1, 101), 'verify ok');
    assert(!c.verify_commitment(id, 0, 2, 101), 'verify fails on other');
}

#[test]
#[should_panic(expected: 'not operator')]
fn only_operator_reveals() {
    let c = deploy();
    let (id, receivers, salts) = drawn_group(c);
    request_reveal_on_the_day(c, id);
    as_caller(c, admin());
    c.reveal(id, receivers, salts);
}

#[test]
#[should_panic(expected: 'reveal not requested')]
fn reveal_needs_admin_request() {
    let c = deploy();
    let (id, receivers, salts) = drawn_group(c);
    as_caller(c, operator());
    c.reveal(id, receivers, salts);
}

#[test]
#[should_panic(expected: 'commitment mismatch')]
fn reveal_rejects_wrong_salt() {
    let c = deploy();
    let (id, receivers, _) = drawn_group(c);
    request_reveal_on_the_day(c, id);
    as_caller(c, operator());
    c.reveal(id, receivers, array![101, 202, 303, 405]);
}

#[test]
#[should_panic(expected: 'commitment mismatch')]
fn reveal_rejects_different_permutation() {
    let c = deploy();
    let (id, _, salts) = drawn_group(c);
    request_reveal_on_the_day(c, id);
    as_caller(c, operator());
    // otra permutación válida pero que no es la sellada
    c.reveal(id, array![3, 0, 1, 2], salts);
}

#[test]
#[should_panic(expected: 'self assignment')]
fn reveal_rejects_self_assignment() {
    let c = deploy();
    let (id, _, salts) = drawn_group(c);
    request_reveal_on_the_day(c, id);
    as_caller(c, operator());
    c.reveal(id, array![0, 2, 3, 1], salts);
}

#[test]
#[should_panic(expected: 'duplicate receiver')]
fn reveal_rejects_non_bijection() {
    let c = deploy();
    let (id, _, salts) = drawn_group(c);
    request_reveal_on_the_day(c, id);
    as_caller(c, operator());
    c.reveal(id, array![1, 2, 1, 2], salts);
}

#[test]
#[should_panic(expected: 'receiver out of range')]
fn reveal_rejects_out_of_range() {
    let c = deploy();
    let (id, _, salts) = drawn_group(c);
    request_reveal_on_the_day(c, id);
    as_caller(c, operator());
    c.reveal(id, array![1, 2, 3, 9], salts);
}

#[test]
#[should_panic(expected: 'bad lengths')]
fn reveal_checks_lengths() {
    let c = deploy();
    let (id, _, salts) = drawn_group(c);
    request_reveal_on_the_day(c, id);
    as_caller(c, operator());
    c.reveal(id, array![1, 2, 3], salts);
}

#[test]
#[should_panic(expected: 'exclusion violated')]
fn reveal_rejects_excluded_pair() {
    let c = deploy();
    let id = full_group(c);
    // 0 y 1 son pareja, pero el "sorteo" les toca entre sí
    as_caller(c, admin());
    c.set_exclusions(id, array![Exclusion { a: 1, b: 0 }]);
    stop(c);
    let (receivers, salts, commitments) = fixture(id);
    as_caller(c, admin());
    c.request_draw(id);
    stop(c);
    as_caller(c, operator());
    c.publish_draw(id, commitments, ciphertexts(4), "sealed");
    stop(c);
    request_reveal_on_the_day(c, id);
    as_caller(c, operator());
    c.reveal(id, receivers, salts);
}

#[test]
#[should_panic(expected: 'already revealed')]
fn no_wishlist_edits_after_reveal() {
    let c = deploy();
    let (id, receivers, salts) = drawn_group(c);
    request_reveal_on_the_day(c, id);
    as_caller(c, operator());
    c.reveal(id, receivers, salts);
    stop(c);
    as_caller(c, ana());
    c.update_wishlist(id, 0, wishlist("tarde"));
}

#[test]
fn clone_group_copies_ghosts_and_enables_avoid_previous() {
    let c = deploy();
    let (id, receivers, salts) = drawn_group(c);
    request_reveal_on_the_day(c, id);
    as_caller(c, operator());
    c.reveal(id, receivers, salts);
    stop(c);
    as_caller(c, admin());
    let new_id = c.clone_group(id, EVENT_AT + 365 * 86400, 'nuevo');
    stop(c);
    let g = c.get_group(new_id);
    assert(g.previous_group_id == id, 'previous');
    assert(g.avoid_previous, 'avoid previous on');
    assert(g.name == "navidad" && g.expected_count == 4, 'copied metadata');
    assert(g.status == status::OPEN, 'open');
    assert(g.invite_code_hash != 0 && g.invite_code_hash != 'nuevo', 'new invite hashed');
    assert(c.get_participant_count(new_id) == 1, 'only the ghost');
    let p = c.get_participant(new_id, 0);
    assert(p.is_ghost && p.name == "abuela", 'abuela copied');
    assert(c.get_wishlist(new_id, 0).ideas == "un nieto que la visite", 'ghost wishlist');
    // la admin puede apagar la regla
    as_caller(c, admin());
    c.set_avoid_previous(new_id, false);
    assert(!c.get_group(new_id).avoid_previous, 'avoid previous off');
    // y los de cuenta vuelven a entrar por el link nuevo
    stop(c);
    as_caller(c, ana());
    c.join(new_id, 'nuevo', "ana", 1, 777, wishlist("libros"));
    stop(c);
    assert(c.get_participant_index(new_id, ana()) == Option::Some(1), 'ana rejoined');
}
