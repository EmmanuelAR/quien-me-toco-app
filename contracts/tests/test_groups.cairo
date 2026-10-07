use quien_me_toco::{Exclusion, IQuienMeTocoDispatcherTrait, status};
use super::common::*;

#[test]
fn create_group_stores_everything() {
    let c = deploy();
    let id = create_group(c, 4);
    assert(id == 1, 'first id is 1');
    let g = c.get_group(id);
    assert(g.admin == admin(), 'admin');
    assert(g.name == "navidad", 'name');
    assert(g.event_at == EVENT_AT, 'event_at');
    assert(g.place == "casa de la abuela", 'place');
    assert(g.budget_min == 5000 && g.budget_max == 10000, 'budget');
    assert(g.currency == 'CRC', 'currency');
    assert(g.expected_count == 4, 'expected');
    assert(g.invite_code == INVITE, 'invite');
    assert(g.status == status::OPEN, 'open');
    assert(!g.avoid_previous, 'no previous');
    assert(c.get_participant_count(id) == 0, 'empty');
    let mine = c.groups_of_admin(admin());
    assert(mine.len() == 1 && *mine.at(0) == id, 'groups_of_admin');
}

#[test]
#[should_panic(expected: 'min 3 participants')]
fn create_group_needs_three() {
    let c = deploy();
    create_group(c, 2);
}

#[test]
#[should_panic(expected: 'bad budget')]
fn create_group_budget_order() {
    let c = deploy();
    as_caller(c, admin());
    c.create_group("x", EVENT_AT, "", 10, 5, 'CRC', "", 3, INVITE, 0);
}

#[test]
#[should_panic(expected: 'name required')]
fn create_group_needs_name() {
    let c = deploy();
    as_caller(c, admin());
    c.create_group("", EVENT_AT, "", 1, 5, 'CRC', "", 3, INVITE, 0);
}

#[test]
#[should_panic(expected: 'no such group')]
fn get_group_unknown_panics() {
    let c = deploy();
    c.get_group(99);
}

#[test]
fn join_registers_and_lists() {
    let c = deploy();
    let id = create_group(c, 4);
    let idx = join(c, id, ana(), "ana", 11);
    assert(idx == 0, 'first index');
    assert(c.get_participant_count(id) == 1, 'count');
    let p = c.get_participant(id, 0);
    assert(p.account == ana() && p.name == "ana" && p.enc_pubkey == 11, 'participant');
    assert(!p.is_ghost, 'not ghost');
    assert(p.email_commit == 777, 'email commit');
    assert(c.get_participant_index(id, ana()) == Option::Some(0), 'index lookup');
    assert(c.get_participant_index(id, beto()) == Option::None, 'not joined');
    assert(c.get_wishlist(id, 0).ideas == "algo", 'wishlist');
    let groups = c.groups_of_participant(ana());
    assert(groups.len() == 1 && *groups.at(0) == id, 'groups_of_participant');
}

#[test]
#[should_panic(expected: 'bad invite code')]
fn join_needs_invite_code() {
    let c = deploy();
    let id = create_group(c, 4);
    as_caller(c, ana());
    c.join(id, 'otro', "ana", 1, 0, wishlist(""));
}

#[test]
#[should_panic(expected: 'already joined')]
fn join_once_per_account() {
    let c = deploy();
    let id = create_group(c, 4);
    join(c, id, ana(), "ana", 1);
    join(c, id, ana(), "ana otra vez", 2);
}

#[test]
#[should_panic(expected: 'group is full')]
fn join_respects_expected_count() {
    let c = deploy();
    let id = create_group(c, 3);
    join(c, id, ana(), "ana", 1);
    join(c, id, beto(), "beto", 2);
    join(c, id, carla(), "carla", 3);
    join(c, id, dani(), "dani", 4);
}

#[test]
#[should_panic(expected: 'registrations closed')]
fn join_fails_when_closed() {
    let c = deploy();
    let id = create_group(c, 4);
    as_caller(c, admin());
    c.close_registrations(id);
    stop(c);
    join(c, id, ana(), "ana", 1);
}

#[test]
#[should_panic(expected: 'pubkey required')]
fn join_needs_pubkey() {
    let c = deploy();
    let id = create_group(c, 4);
    join(c, id, ana(), "ana", 0);
}

#[test]
fn close_and_reopen_registrations() {
    let c = deploy();
    let id = create_group(c, 4);
    as_caller(c, admin());
    c.close_registrations(id);
    assert(c.get_group(id).status == status::CLOSED, 'closed');
    c.reopen_registrations(id);
    assert(c.get_group(id).status == status::OPEN, 'open again');
}

#[test]
#[should_panic(expected: 'not admin')]
fn only_admin_closes() {
    let c = deploy();
    let id = create_group(c, 4);
    as_caller(c, stranger());
    c.close_registrations(id);
}

#[test]
fn ghosts_count_and_admin_edits_their_wishlist() {
    let c = deploy();
    let id = create_group(c, 3);
    as_caller(c, admin());
    let idx = c.add_ghost(id, "abuela", wishlist("un nieto"));
    assert(idx == 0, 'ghost index');
    let p = c.get_participant(id, 0);
    assert(p.is_ghost && p.account.into() == 0_felt252 && p.enc_pubkey == 0, 'ghost data');
    c.update_wishlist(id, 0, wishlist("dos nietos"));
    assert(c.get_wishlist(id, 0).ideas == "dos nietos", 'admin edited ghost');
    assert(c.get_participant_count(id) == 1, 'counts');
}

#[test]
#[should_panic(expected: 'admin edits ghosts only')]
fn stranger_cannot_edit_ghost_wishlist() {
    let c = deploy();
    let id = create_group(c, 3);
    as_caller(c, admin());
    c.add_ghost(id, "abuela", wishlist(""));
    stop(c);
    as_caller(c, stranger());
    c.update_wishlist(id, 0, wishlist("hackeo"));
}

#[test]
#[should_panic(expected: 'not participant')]
fn admin_cannot_edit_account_wishlist() {
    let c = deploy();
    let id = create_group(c, 4);
    join(c, id, ana(), "ana", 1);
    as_caller(c, admin());
    c.update_wishlist(id, 0, wishlist("lo que yo diga"));
}

#[test]
fn participant_edits_own_wishlist_any_time() {
    let c = deploy();
    let id = full_group(c);
    as_caller(c, ana());
    c.update_wishlist(id, 0, wishlist("libros"));
    stop(c);
    assert(c.get_wishlist(id, 0).ideas == "libros", 'before draw');
    as_caller(c, admin());
    c.request_draw(id);
    stop(c);
    as_caller(c, operator());
    c.publish_draw(id, array![1, 2, 3, 4], ciphertexts(4), "sealed");
    stop(c);
    as_caller(c, ana());
    c.update_wishlist(id, 0, wishlist("cafe"));
    stop(c);
    assert(c.get_wishlist(id, 0).ideas == "cafe", 'after draw');
}

#[test]
fn remove_participant_swaps_last_into_hole() {
    let c = deploy();
    let id = create_group(c, 4);
    join(c, id, ana(), "ana", 1);
    join(c, id, beto(), "beto", 2);
    join(c, id, carla(), "carla", 3);
    as_caller(c, admin());
    c.set_exclusions(id, array![Exclusion { a: 0, b: 1 }]);
    c.remove_participant(id, 0);
    stop(c);
    assert(c.get_participant_count(id) == 2, 'count');
    assert(c.get_participant(id, 0).account == carla(), 'carla moved to 0');
    assert(c.get_participant_index(id, carla()) == Option::Some(0), 'carla index');
    assert(c.get_participant_index(id, ana()) == Option::None, 'ana gone');
    assert(c.get_participant_index(id, beto()) == Option::Some(1), 'beto stays');
    assert(c.get_exclusions(id).len() == 0, 'exclusions cleared');
}

#[test]
fn set_expected_count_bounds() {
    let c = deploy();
    let id = create_group(c, 4);
    join(c, id, ana(), "ana", 1);
    join(c, id, beto(), "beto", 2);
    join(c, id, carla(), "carla", 3);
    as_caller(c, admin());
    c.set_expected_count(id, 3);
    assert(c.get_group(id).expected_count == 3, 'lowered');
    c.set_expected_count(id, 10);
    assert(c.get_group(id).expected_count == 10, 'raised');
}

#[test]
#[should_panic(expected: 'count below participants')]
fn set_expected_count_not_below_registered() {
    let c = deploy();
    let id = create_group(c, 5);
    join(c, id, ana(), "ana", 1);
    join(c, id, beto(), "beto", 2);
    join(c, id, carla(), "carla", 3);
    join(c, id, dani(), "dani", 4);
    as_caller(c, admin());
    c.set_expected_count(id, 3);
}

#[test]
fn exclusions_replace_previous_list() {
    let c = deploy();
    let id = full_group(c);
    as_caller(c, admin());
    c.set_exclusions(id, array![Exclusion { a: 0, b: 1 }, Exclusion { a: 2, b: 3 }]);
    assert(c.get_exclusions(id).len() == 2, 'two');
    c.set_exclusions(id, array![Exclusion { a: 1, b: 2 }]);
    let ex = c.get_exclusions(id);
    assert(ex.len() == 1, 'one');
    assert(*ex.at(0) == Exclusion { a: 1, b: 2 }, 'replaced');
}

#[test]
#[should_panic(expected: 'bad exclusion')]
fn exclusions_must_reference_participants() {
    let c = deploy();
    let id = full_group(c);
    as_caller(c, admin());
    c.set_exclusions(id, array![Exclusion { a: 0, b: 9 }]);
}

#[test]
#[should_panic(expected: 'bad exclusion')]
fn exclusions_cannot_be_self() {
    let c = deploy();
    let id = full_group(c);
    as_caller(c, admin());
    c.set_exclusions(id, array![Exclusion { a: 1, b: 1 }]);
}

#[test]
#[should_panic(expected: 'draw already started')]
fn exclusions_locked_after_draw_request() {
    let c = deploy();
    let id = full_group(c);
    as_caller(c, admin());
    c.request_draw(id);
    c.set_exclusions(id, array![Exclusion { a: 0, b: 1 }]);
}

#[test]
fn update_group_changes_event_details() {
    let c = deploy();
    let id = create_group(c, 4);
    as_caller(c, admin());
    c.update_group(id, "navidad 2027", EVENT_AT + 10, "otra casa", 1000, 2000, "sin calcetines");
    let g = c.get_group(id);
    assert(g.name == "navidad 2027" && g.event_at == EVENT_AT + 10, 'updated');
    assert(g.place == "otra casa" && g.rules == "sin calcetines", 'place rules');
    assert(g.budget_min == 1000 && g.budget_max == 2000, 'budget');
}

#[test]
#[should_panic(expected: 'not owner')]
fn only_owner_sets_operator() {
    let c = deploy();
    as_caller(c, admin());
    c.set_operator(stranger());
}

#[test]
fn owner_sets_operator() {
    let c = deploy();
    as_caller(c, owner());
    c.set_operator(stranger());
    assert(c.get_operator() == stranger(), 'operator changed');
}

#[test]
#[should_panic(expected: 'previous not revealed')]
fn clone_requires_revealed_previous() {
    let c = deploy();
    let id = create_group(c, 4);
    as_caller(c, admin());
    c.clone_group(id, EVENT_AT + 1000, 'nuevo');
}

#[test]
#[should_panic(expected: 'not admin')]
fn create_with_previous_requires_same_admin() {
    let c = deploy();
    let id = create_group(c, 4);
    as_caller(c, stranger());
    c.create_group("copia", EVENT_AT, "", 1, 2, 'CRC', "", 3, 'x', id);
}
