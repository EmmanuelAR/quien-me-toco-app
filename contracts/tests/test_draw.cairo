use quien_me_toco::{IQuienMeTocoDispatcherTrait, status};
use super::common::*;

#[test]
fn request_draw_when_everyone_is_in() {
    let c = deploy();
    let id = full_group(c);
    as_caller(c, admin());
    c.request_draw(id);
    assert(c.get_group(id).status == status::DRAW_REQUESTED, 'requested');
}

#[test]
#[should_panic(expected: 'not everyone registered')]
fn request_draw_waits_for_everyone() {
    let c = deploy();
    let id = create_group(c, 4);
    join(c, id, ana(), "ana", 1);
    join(c, id, beto(), "beto", 2);
    join(c, id, carla(), "carla", 3);
    as_caller(c, admin());
    c.request_draw(id);
}

#[test]
#[should_panic(expected: 'not admin')]
fn only_admin_requests_draw() {
    let c = deploy();
    let id = full_group(c);
    as_caller(c, ana());
    c.request_draw(id);
}

#[test]
fn cancel_draw_request_goes_back_to_closed() {
    let c = deploy();
    let id = full_group(c);
    as_caller(c, admin());
    c.request_draw(id);
    c.cancel_draw_request(id);
    assert(c.get_group(id).status == status::CLOSED, 'closed');
    // y se pueden volver a editar exclusiones
    c.set_exclusions(id, array![]);
}

#[test]
fn publish_draw_stores_commitments_and_ciphertexts() {
    let c = deploy();
    let id = full_group(c);
    as_caller(c, admin());
    c.request_draw(id);
    stop(c);
    assert(c.get_commitments(id).len() == 0, 'nothing before draw');
    as_caller(c, operator());
    c.publish_draw(id, array![11, 22, 33, 44], ciphertexts(4), "sealed");
    stop(c);
    let g = c.get_group(id);
    assert(g.status == status::DRAWN, 'drawn');
    assert(g.drawn_at == EVENT_AT - 30 * 86400, 'drawn_at = block ts');
    let cs = c.get_commitments(id);
    assert(cs.len() == 4 && *cs.at(2) == 33, 'commitments');
    assert(c.get_ciphertext(id, 1) == "cifrado", 'ciphertext');
    assert(c.get_sealed_reveal(id) == "sealed", 'sealed');
}

#[test]
#[should_panic(expected: 'not operator')]
fn only_operator_publishes() {
    let c = deploy();
    let id = full_group(c);
    as_caller(c, admin());
    c.request_draw(id);
    c.publish_draw(id, array![1, 2, 3, 4], ciphertexts(4), "sealed");
}

#[test]
#[should_panic(expected: 'draw not requested')]
fn publish_needs_request() {
    let c = deploy();
    let id = full_group(c);
    as_caller(c, operator());
    c.publish_draw(id, array![1, 2, 3, 4], ciphertexts(4), "sealed");
}

#[test]
#[should_panic(expected: 'draw not requested')]
fn publish_only_once() {
    let c = deploy();
    let id = full_group(c);
    as_caller(c, admin());
    c.request_draw(id);
    stop(c);
    as_caller(c, operator());
    c.publish_draw(id, array![1, 2, 3, 4], ciphertexts(4), "sealed");
    c.publish_draw(id, array![5, 6, 7, 8], ciphertexts(4), "sealed2");
}

#[test]
#[should_panic(expected: 'bad lengths')]
fn publish_checks_lengths() {
    let c = deploy();
    let id = full_group(c);
    as_caller(c, admin());
    c.request_draw(id);
    stop(c);
    as_caller(c, operator());
    c.publish_draw(id, array![1, 2, 3], ciphertexts(4), "sealed");
}

#[test]
#[should_panic(expected: 'draw already started')]
fn no_more_ghosts_after_draw_request() {
    let c = deploy();
    let id = full_group(c);
    as_caller(c, admin());
    c.request_draw(id);
    c.add_ghost(id, "colado", wishlist(""));
}

#[test]
fn rotate_key_bumps_version_and_allows_reencrypt() {
    let c = deploy();
    let id = full_group(c);
    as_caller(c, admin());
    c.request_draw(id);
    stop(c);
    as_caller(c, operator());
    c.publish_draw(id, array![1, 2, 3, 4], ciphertexts(4), "sealed");
    stop(c);
    let (kv, cv) = c.get_key_versions(id, 0);
    assert(kv == 0 && cv == 0, 'versions start at 0');
    as_caller(c, ana());
    c.rotate_enc_pubkey(id, 0, 999);
    stop(c);
    assert(c.get_participant(id, 0).enc_pubkey == 999, 'pubkey rotated');
    let (kv, cv) = c.get_key_versions(id, 0);
    assert(kv == 1 && cv == 0, 'key ahead of ct');
    as_caller(c, operator());
    c.update_ciphertext(id, 0, "recifrado");
    stop(c);
    assert(c.get_ciphertext(id, 0) == "recifrado", 'updated');
    let (kv, cv) = c.get_key_versions(id, 0);
    assert(kv == 1 && cv == 1, 'in sync');
}

#[test]
#[should_panic(expected: 'ciphertext up to date')]
fn update_ciphertext_only_after_rotation() {
    let c = deploy();
    let id = full_group(c);
    as_caller(c, admin());
    c.request_draw(id);
    stop(c);
    as_caller(c, operator());
    c.publish_draw(id, array![1, 2, 3, 4], ciphertexts(4), "sealed");
    c.update_ciphertext(id, 0, "recifrado");
}

#[test]
#[should_panic(expected: 'not participant')]
fn only_owner_rotates_their_key() {
    let c = deploy();
    let id = full_group(c);
    as_caller(c, beto());
    c.rotate_enc_pubkey(id, 0, 999);
}

#[test]
#[should_panic(expected: 'not participant')]
fn ghosts_have_no_key_to_rotate() {
    let c = deploy();
    let id = full_group(c);
    as_caller(c, admin());
    c.rotate_enc_pubkey(id, 3, 999);
}
