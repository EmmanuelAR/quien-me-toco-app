/// ¿quién me tocó? — amigo secreto en starknet sepolia.
///
/// el contrato es la base de datos y el árbitro del flujo:
///   Open → Closed → DrawRequested → Drawn → RevealRequested → Revealed
/// la admin mueve el estado con su wallet (cavos); el servidor (`operator`) publica el
/// sorteo (sellos + papelitos cifrados) y después la revelación (permutación + salts),
/// y el contrato comprueba que todo coincide con lo sellado.
#[starknet::contract]
pub mod QuienMeToco {
    use core::dict::{Felt252Dict, Felt252DictTrait};
    use core::num::traits::Zero;
    use core::poseidon::poseidon_hash_span;
    use starknet::storage::{
        Map, MutableVecTrait, StoragePathEntry, StoragePointerReadAccess,
        StoragePointerWriteAccess, Vec, VecTrait,
    };
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use crate::interface::IQuienMeToco;
    use crate::types::{Exclusion, Group, Participant, Wishlist, status};

    pub const MIN_PARTICIPANTS: u32 = 3;
    /// la revelación se habilita desde 24 h antes de la fecha del intercambio
    pub const REVEAL_GRACE_SECS: u64 = 86400;

    #[storage]
    struct Storage {
        owner: ContractAddress,
        operator: ContractAddress,
        next_group_id: u64,
        groups: Map<u64, Group>,
        participant_count: Map<u64, u32>,
        participants: Map<(u64, u32), Participant>,
        wishlists: Map<(u64, u32), Wishlist>,
        /// índice + 1 (0 = no está)
        participant_index: Map<(u64, ContractAddress), u32>,
        exclusion_count: Map<u64, u32>,
        exclusions: Map<(u64, u32), Exclusion>,
        commitments: Map<(u64, u32), felt252>,
        ciphertexts: Map<(u64, u32), ByteArray>,
        sealed_reveal: Map<u64, ByteArray>,
        reveal_receivers: Map<(u64, u32), u32>,
        reveal_salts: Map<(u64, u32), felt252>,
        key_version: Map<(u64, u32), u32>,
        ct_version: Map<(u64, u32), u32>,
        groups_of_admin: Map<ContractAddress, Vec<u64>>,
        groups_of_participant: Map<ContractAddress, Vec<u64>>,
        /// apagado: el grupo sigue en la cadena, pero la app no lo muestra
        archived: Map<u64, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        GroupCreated: GroupCreated,
        Joined: Joined,
        GhostAdded: GhostAdded,
        ParticipantRemoved: ParticipantRemoved,
        RegistrationsClosed: RegistrationsClosed,
        RegistrationsReopened: RegistrationsReopened,
        ExclusionsSet: ExclusionsSet,
        DrawRequested: DrawRequested,
        DrawCancelled: DrawCancelled,
        DrawPublished: DrawPublished,
        KeyRotated: KeyRotated,
        CiphertextUpdated: CiphertextUpdated,
        RevealRequested: RevealRequested,
        Revealed: Revealed,
        OperatorChanged: OperatorChanged,
        GroupArchived: GroupArchived,
    }

    #[derive(Drop, starknet::Event)]
    pub struct GroupCreated {
        #[key]
        pub group_id: u64,
        pub admin: ContractAddress,
        pub previous_group_id: u64,
    }
    #[derive(Drop, starknet::Event)]
    pub struct Joined {
        #[key]
        pub group_id: u64,
        pub index: u32,
        pub account: ContractAddress,
    }
    #[derive(Drop, starknet::Event)]
    pub struct GhostAdded {
        #[key]
        pub group_id: u64,
        pub index: u32,
    }
    #[derive(Drop, starknet::Event)]
    pub struct ParticipantRemoved {
        #[key]
        pub group_id: u64,
        pub index: u32,
    }
    #[derive(Drop, starknet::Event)]
    pub struct RegistrationsClosed {
        #[key]
        pub group_id: u64,
    }
    #[derive(Drop, starknet::Event)]
    pub struct RegistrationsReopened {
        #[key]
        pub group_id: u64,
    }
    #[derive(Drop, starknet::Event)]
    pub struct ExclusionsSet {
        #[key]
        pub group_id: u64,
        pub count: u32,
    }
    #[derive(Drop, starknet::Event)]
    pub struct DrawRequested {
        #[key]
        pub group_id: u64,
    }
    #[derive(Drop, starknet::Event)]
    pub struct DrawCancelled {
        #[key]
        pub group_id: u64,
    }
    #[derive(Drop, starknet::Event)]
    pub struct DrawPublished {
        #[key]
        pub group_id: u64,
        pub drawn_at: u64,
    }
    #[derive(Drop, starknet::Event)]
    pub struct KeyRotated {
        #[key]
        pub group_id: u64,
        pub index: u32,
        pub version: u32,
    }
    #[derive(Drop, starknet::Event)]
    pub struct CiphertextUpdated {
        #[key]
        pub group_id: u64,
        pub index: u32,
        pub version: u32,
    }
    #[derive(Drop, starknet::Event)]
    pub struct RevealRequested {
        #[key]
        pub group_id: u64,
    }
    #[derive(Drop, starknet::Event)]
    pub struct Revealed {
        #[key]
        pub group_id: u64,
        pub revealed_at: u64,
    }
    #[derive(Drop, starknet::Event)]
    pub struct OperatorChanged {
        pub operator: ContractAddress,
    }
    #[derive(Drop, starknet::Event)]
    pub struct GroupArchived {
        #[key]
        pub group_id: u64,
        pub archived: bool,
    }

    pub mod errors {
        pub const NOT_OWNER: felt252 = 'not owner';
        pub const NOT_OPERATOR: felt252 = 'not operator';
        pub const NOT_ADMIN: felt252 = 'not admin';
        pub const NOT_PARTICIPANT: felt252 = 'not participant';
        pub const NO_GROUP: felt252 = 'no such group';
        pub const NAME_REQUIRED: felt252 = 'name required';
        pub const BAD_BUDGET: felt252 = 'bad budget';
        pub const TOO_FEW: felt252 = 'min 3 participants';
        pub const INVITE_REQUIRED: felt252 = 'invite code required';
        pub const BAD_INVITE: felt252 = 'bad invite code';
        pub const NOT_OPEN: felt252 = 'registrations closed';
        pub const NOT_CLOSED: felt252 = 'not closed';
        pub const FULL: felt252 = 'group is full';
        pub const ALREADY_JOINED: felt252 = 'already joined';
        pub const PUBKEY_REQUIRED: felt252 = 'pubkey required';
        pub const BAD_INDEX: felt252 = 'bad index';
        pub const DRAW_LOCKED: felt252 = 'draw already started';
        pub const ALREADY_REVEALED: felt252 = 'already revealed';
        pub const NOT_EVERYONE: felt252 = 'not everyone registered';
        pub const NOT_DRAW_REQUESTED: felt252 = 'draw not requested';
        pub const NOT_DRAWN: felt252 = 'not drawn';
        pub const NOT_REVEAL_REQUESTED: felt252 = 'reveal not requested';
        pub const TOO_EARLY: felt252 = 'too early to reveal';
        pub const BAD_LENGTHS: felt252 = 'bad lengths';
        pub const COUNT_TOO_LOW: felt252 = 'count below participants';
        pub const BAD_EXCLUSION: felt252 = 'bad exclusion';
        pub const CT_UP_TO_DATE: felt252 = 'ciphertext up to date';
        pub const RECEIVER_RANGE: felt252 = 'receiver out of range';
        pub const SELF_ASSIGNMENT: felt252 = 'self assignment';
        pub const DUP_RECEIVER: felt252 = 'duplicate receiver';
        pub const EXCLUDED: felt252 = 'exclusion violated';
        pub const COMMITMENT: felt252 = 'commitment mismatch';
        pub const PREV_NOT_REVEALED: felt252 = 'previous not revealed';
        pub const ONLY_GHOST_BY_ADMIN: felt252 = 'admin edits ghosts only';
        pub const ARCHIVED: felt252 = 'group archived';
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress, operator: ContractAddress) {
        self.owner.write(owner);
        self.operator.write(operator);
        self.next_group_id.write(1);
    }

    #[abi(embed_v0)]
    impl QuienMeTocoImpl of IQuienMeToco<ContractState> {
        // ------------------------------------------------------------------ admin
        fn create_group(
            ref self: ContractState,
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
        ) -> u64 {
            let caller = get_caller_address();
            if previous_group_id != 0 {
                let prev = self.group_or_panic(previous_group_id);
                assert(prev.admin == caller, errors::NOT_ADMIN);
            }
            self
                .store_new_group(
                    caller,
                    name,
                    event_at,
                    place,
                    budget_min,
                    budget_max,
                    currency,
                    rules,
                    expected_count,
                    invite_code,
                    previous_group_id,
                )
        }

        fn clone_group(
            ref self: ContractState, previous_group_id: u64, event_at: u64, invite_code: felt252,
        ) -> u64 {
            let caller = get_caller_address();
            let prev = self.group_or_panic(previous_group_id);
            assert(prev.admin == caller, errors::NOT_ADMIN);
            assert(prev.status == status::REVEALED, errors::PREV_NOT_REVEALED);
            let new_id = self
                .store_new_group(
                    caller,
                    prev.name.clone(),
                    event_at,
                    prev.place.clone(),
                    prev.budget_min,
                    prev.budget_max,
                    prev.currency,
                    prev.rules.clone(),
                    prev.expected_count,
                    invite_code,
                    previous_group_id,
                );
            // copiar participantes sin cuenta con su wishlist
            let n = self.participant_count.entry(previous_group_id).read();
            let mut i: u32 = 0;
            let mut copied: u32 = 0;
            while i < n {
                let p = self.participants.entry((previous_group_id, i)).read();
                if p.is_ghost {
                    let w = self.wishlists.entry((previous_group_id, i)).read();
                    self.participants.entry((new_id, copied)).write(p);
                    self.wishlists.entry((new_id, copied)).write(w);
                    self.emit(GhostAdded { group_id: new_id, index: copied });
                    copied += 1;
                }
                i += 1;
            }
            self.participant_count.entry(new_id).write(copied);
            new_id
        }

        fn update_group(
            ref self: ContractState,
            group_id: u64,
            name: ByteArray,
            event_at: u64,
            place: ByteArray,
            budget_min: u32,
            budget_max: u32,
            rules: ByteArray,
        ) {
            let mut g = self.admin_group(group_id);
            assert(g.status != status::REVEALED, errors::ALREADY_REVEALED);
            assert(name.len() > 0, errors::NAME_REQUIRED);
            assert(budget_max >= budget_min, errors::BAD_BUDGET);
            g.name = name;
            g.event_at = event_at;
            g.place = place;
            g.budget_min = budget_min;
            g.budget_max = budget_max;
            g.rules = rules;
            self.groups.entry(group_id).write(g);
        }

        fn set_expected_count(ref self: ContractState, group_id: u64, count: u32) {
            let mut g = self.admin_group(group_id);
            assert(g.status == status::OPEN || g.status == status::CLOSED, errors::DRAW_LOCKED);
            assert(count >= MIN_PARTICIPANTS, errors::TOO_FEW);
            assert(count >= self.participant_count.entry(group_id).read(), errors::COUNT_TOO_LOW);
            g.expected_count = count;
            self.groups.entry(group_id).write(g);
        }

        fn close_registrations(ref self: ContractState, group_id: u64) {
            let mut g = self.admin_group(group_id);
            assert(g.status == status::OPEN, errors::NOT_OPEN);
            g.status = status::CLOSED;
            self.groups.entry(group_id).write(g);
            self.emit(RegistrationsClosed { group_id });
        }

        fn reopen_registrations(ref self: ContractState, group_id: u64) {
            let mut g = self.admin_group(group_id);
            assert(g.status == status::CLOSED, errors::NOT_CLOSED);
            g.status = status::OPEN;
            self.groups.entry(group_id).write(g);
            self.emit(RegistrationsReopened { group_id });
        }

        fn set_exclusions(ref self: ContractState, group_id: u64, pairs: Array<Exclusion>) {
            let g = self.admin_group(group_id);
            assert(g.status == status::OPEN || g.status == status::CLOSED, errors::DRAW_LOCKED);
            let n = self.participant_count.entry(group_id).read();
            let count = pairs.len();
            let mut i: u32 = 0;
            while i < count {
                let e = *pairs.at(i);
                assert(e.a < n && e.b < n && e.a != e.b, errors::BAD_EXCLUSION);
                self.exclusions.entry((group_id, i)).write(e);
                i += 1;
            }
            self.exclusion_count.entry(group_id).write(count);
            self.emit(ExclusionsSet { group_id, count });
        }

        fn set_avoid_previous(ref self: ContractState, group_id: u64, enabled: bool) {
            let mut g = self.admin_group(group_id);
            assert(g.status == status::OPEN || g.status == status::CLOSED, errors::DRAW_LOCKED);
            g.avoid_previous = enabled && g.previous_group_id != 0;
            self.groups.entry(group_id).write(g);
        }

        fn add_ghost(
            ref self: ContractState, group_id: u64, name: ByteArray, wishlist: Wishlist,
        ) -> u32 {
            self.ensure_live(group_id);
            let g = self.admin_group(group_id);
            assert(g.status == status::OPEN || g.status == status::CLOSED, errors::DRAW_LOCKED);
            assert(name.len() > 0, errors::NAME_REQUIRED);
            let n = self.participant_count.entry(group_id).read();
            assert(n < g.expected_count, errors::FULL);
            let p = Participant {
                account: Zero::zero(), name, enc_pubkey: 0, email_commit: 0, is_ghost: true,
            };
            self.participants.entry((group_id, n)).write(p);
            self.wishlists.entry((group_id, n)).write(wishlist);
            self.participant_count.entry(group_id).write(n + 1);
            self.emit(GhostAdded { group_id, index: n });
            n
        }

        fn remove_participant(ref self: ContractState, group_id: u64, index: u32) {
            let g = self.admin_group(group_id);
            assert(g.status == status::OPEN || g.status == status::CLOSED, errors::DRAW_LOCKED);
            let n = self.participant_count.entry(group_id).read();
            assert(index < n, errors::BAD_INDEX);
            // las exclusiones referencian índices: se limpian al quitar a alguien
            self.exclusion_count.entry(group_id).write(0);
            let removed = self.participants.entry((group_id, index)).read();
            if !removed.is_ghost {
                self.participant_index.entry((group_id, removed.account)).write(0);
            }
            let last = n - 1;
            if index != last {
                let moved = self.participants.entry((group_id, last)).read();
                let moved_w = self.wishlists.entry((group_id, last)).read();
                if !moved.is_ghost {
                    self.participant_index.entry((group_id, moved.account)).write(index + 1);
                }
                self.participants.entry((group_id, index)).write(moved);
                self.wishlists.entry((group_id, index)).write(moved_w);
                let kv = self.key_version.entry((group_id, last)).read();
                self.key_version.entry((group_id, index)).write(kv);
            }
            self.participant_count.entry(group_id).write(last);
            self.emit(ParticipantRemoved { group_id, index });
        }

        fn request_draw(ref self: ContractState, group_id: u64) {
            self.ensure_live(group_id);
            let mut g = self.admin_group(group_id);
            assert(g.status == status::OPEN || g.status == status::CLOSED, errors::DRAW_LOCKED);
            let n = self.participant_count.entry(group_id).read();
            assert(n >= MIN_PARTICIPANTS, errors::TOO_FEW);
            assert(n == g.expected_count, errors::NOT_EVERYONE);
            g.status = status::DRAW_REQUESTED;
            self.groups.entry(group_id).write(g);
            self.emit(DrawRequested { group_id });
        }

        fn cancel_draw_request(ref self: ContractState, group_id: u64) {
            let mut g = self.admin_group(group_id);
            assert(g.status == status::DRAW_REQUESTED, errors::NOT_DRAW_REQUESTED);
            g.status = status::CLOSED;
            self.groups.entry(group_id).write(g);
            self.emit(DrawCancelled { group_id });
        }

        fn set_archived(ref self: ContractState, group_id: u64, archived: bool) {
            let _g = self.admin_group(group_id);
            self.archived.entry(group_id).write(archived);
            self.emit(GroupArchived { group_id, archived });
        }

        fn request_reveal(ref self: ContractState, group_id: u64) {
            self.ensure_live(group_id);
            let mut g = self.admin_group(group_id);
            assert(g.status == status::DRAWN, errors::NOT_DRAWN);
            let now = get_block_timestamp();
            assert(now + REVEAL_GRACE_SECS >= g.event_at, errors::TOO_EARLY);
            g.status = status::REVEAL_REQUESTED;
            self.groups.entry(group_id).write(g);
            self.emit(RevealRequested { group_id });
        }

        // ----------------------------------------------------------- participante
        fn join(
            ref self: ContractState,
            group_id: u64,
            invite_code: felt252,
            name: ByteArray,
            enc_pubkey: u256,
            email_commit: u256,
            wishlist: Wishlist,
        ) -> u32 {
            let caller = get_caller_address();
            self.ensure_live(group_id);
            let g = self.group_or_panic(group_id);
            assert(g.status == status::OPEN, errors::NOT_OPEN);
            assert(g.invite_code == invite_code, errors::BAD_INVITE);
            assert(name.len() > 0, errors::NAME_REQUIRED);
            assert(enc_pubkey != 0, errors::PUBKEY_REQUIRED);
            let n = self.participant_count.entry(group_id).read();
            assert(n < g.expected_count, errors::FULL);
            assert(self.participant_index.entry((group_id, caller)).read() == 0, errors::ALREADY_JOINED);
            let p = Participant { account: caller, name, enc_pubkey, email_commit, is_ghost: false };
            self.participants.entry((group_id, n)).write(p);
            self.wishlists.entry((group_id, n)).write(wishlist);
            self.participant_index.entry((group_id, caller)).write(n + 1);
            self.participant_count.entry(group_id).write(n + 1);
            self.groups_of_participant.entry(caller).push(group_id);
            self.emit(Joined { group_id, index: n, account: caller });
            n
        }

        fn update_wishlist(ref self: ContractState, group_id: u64, index: u32, wishlist: Wishlist) {
            self.ensure_live(group_id);
            let caller = get_caller_address();
            let g = self.group_or_panic(group_id);
            assert(g.status != status::REVEALED, errors::ALREADY_REVEALED);
            let n = self.participant_count.entry(group_id).read();
            assert(index < n, errors::BAD_INDEX);
            let p = self.participants.entry((group_id, index)).read();
            if p.is_ghost {
                assert(caller == g.admin, errors::ONLY_GHOST_BY_ADMIN);
            } else {
                assert(caller == p.account, errors::NOT_PARTICIPANT);
            }
            self.wishlists.entry((group_id, index)).write(wishlist);
        }

        fn rotate_enc_pubkey(ref self: ContractState, group_id: u64, index: u32, new_pubkey: u256) {
            let caller = get_caller_address();
            let g = self.group_or_panic(group_id);
            assert(g.status != status::REVEALED, errors::ALREADY_REVEALED);
            assert(new_pubkey != 0, errors::PUBKEY_REQUIRED);
            let n = self.participant_count.entry(group_id).read();
            assert(index < n, errors::BAD_INDEX);
            let mut p = self.participants.entry((group_id, index)).read();
            assert(!p.is_ghost && caller == p.account, errors::NOT_PARTICIPANT);
            p.enc_pubkey = new_pubkey;
            self.participants.entry((group_id, index)).write(p);
            let v = self.key_version.entry((group_id, index)).read() + 1;
            self.key_version.entry((group_id, index)).write(v);
            self.emit(KeyRotated { group_id, index, version: v });
        }

        // --------------------------------------------------------------- servidor
        fn publish_draw(
            ref self: ContractState,
            group_id: u64,
            commitments: Array<felt252>,
            ciphertexts: Array<ByteArray>,
            sealed_reveal: ByteArray,
        ) {
            self.only_operator();
            self.ensure_live(group_id);
            let mut g = self.group_or_panic(group_id);
            assert(g.status == status::DRAW_REQUESTED, errors::NOT_DRAW_REQUESTED);
            let n = self.participant_count.entry(group_id).read();
            assert(commitments.len() == n && ciphertexts.len() == n, errors::BAD_LENGTHS);
            let mut i: u32 = 0;
            while i < n {
                self.commitments.entry((group_id, i)).write(*commitments.at(i));
                self.ciphertexts.entry((group_id, i)).write(ciphertexts.at(i).clone());
                let kv = self.key_version.entry((group_id, i)).read();
                self.ct_version.entry((group_id, i)).write(kv);
                i += 1;
            }
            self.sealed_reveal.entry(group_id).write(sealed_reveal);
            let now = get_block_timestamp();
            g.status = status::DRAWN;
            g.drawn_at = now;
            self.groups.entry(group_id).write(g);
            self.emit(DrawPublished { group_id, drawn_at: now });
        }

        fn update_ciphertext(
            ref self: ContractState, group_id: u64, index: u32, ciphertext: ByteArray,
        ) {
            self.only_operator();
            let g = self.group_or_panic(group_id);
            assert(
                g.status == status::DRAWN || g.status == status::REVEAL_REQUESTED, errors::NOT_DRAWN,
            );
            let n = self.participant_count.entry(group_id).read();
            assert(index < n, errors::BAD_INDEX);
            let kv = self.key_version.entry((group_id, index)).read();
            let cv = self.ct_version.entry((group_id, index)).read();
            assert(cv < kv, errors::CT_UP_TO_DATE);
            self.ciphertexts.entry((group_id, index)).write(ciphertext);
            self.ct_version.entry((group_id, index)).write(kv);
            self.emit(CiphertextUpdated { group_id, index, version: kv });
        }

        fn reveal(
            ref self: ContractState, group_id: u64, receivers: Array<u32>, salts: Array<felt252>,
        ) {
            self.only_operator();
            let mut g = self.group_or_panic(group_id);
            assert(g.status == status::REVEAL_REQUESTED, errors::NOT_REVEAL_REQUESTED);
            let n = self.participant_count.entry(group_id).read();
            assert(receivers.len() == n && salts.len() == n, errors::BAD_LENGTHS);
            let mut seen: Felt252Dict<u8> = Default::default();
            let mut i: u32 = 0;
            while i < n {
                let r = *receivers.at(i);
                let salt = *salts.at(i);
                assert(r < n, errors::RECEIVER_RANGE);
                assert(r != i, errors::SELF_ASSIGNMENT);
                assert(seen.get(r.into()) == 0, errors::DUP_RECEIVER);
                seen.insert(r.into(), 1);
                assert(!self.is_excluded(group_id, i, r), errors::EXCLUDED);
                let c = commitment_of(group_id, i, r, salt);
                assert(c == self.commitments.entry((group_id, i)).read(), errors::COMMITMENT);
                self.reveal_receivers.entry((group_id, i)).write(r);
                self.reveal_salts.entry((group_id, i)).write(salt);
                i += 1;
            }
            let now = get_block_timestamp();
            g.status = status::REVEALED;
            g.revealed_at = now;
            self.groups.entry(group_id).write(g);
            self.emit(Revealed { group_id, revealed_at: now });
        }

        // ------------------------------------------------------------------ owner
        fn set_operator(ref self: ContractState, operator: ContractAddress) {
            assert(get_caller_address() == self.owner.read(), errors::NOT_OWNER);
            self.operator.write(operator);
            self.emit(OperatorChanged { operator });
        }

        // --------------------------------------------------------------- lecturas
        fn get_operator(self: @ContractState) -> ContractAddress {
            self.operator.read()
        }

        fn get_group(self: @ContractState, group_id: u64) -> Group {
            self.group_or_panic(group_id)
        }

        fn is_archived(self: @ContractState, group_id: u64) -> bool {
            let _g = self.group_or_panic(group_id);
            self.archived.entry(group_id).read()
        }

        fn get_participant_count(self: @ContractState, group_id: u64) -> u32 {
            self.participant_count.entry(group_id).read()
        }

        fn get_participant(self: @ContractState, group_id: u64, index: u32) -> Participant {
            assert(index < self.participant_count.entry(group_id).read(), errors::BAD_INDEX);
            self.participants.entry((group_id, index)).read()
        }

        fn get_participants(self: @ContractState, group_id: u64) -> Array<Participant> {
            let n = self.participant_count.entry(group_id).read();
            let mut out: Array<Participant> = array![];
            let mut i: u32 = 0;
            while i < n {
                out.append(self.participants.entry((group_id, i)).read());
                i += 1;
            }
            out
        }

        fn get_participant_index(
            self: @ContractState, group_id: u64, account: ContractAddress,
        ) -> Option<u32> {
            let v = self.participant_index.entry((group_id, account)).read();
            if v == 0 {
                Option::None
            } else {
                Option::Some(v - 1)
            }
        }

        fn get_wishlist(self: @ContractState, group_id: u64, index: u32) -> Wishlist {
            self.wishlists.entry((group_id, index)).read()
        }

        fn get_exclusions(self: @ContractState, group_id: u64) -> Array<Exclusion> {
            let count = self.exclusion_count.entry(group_id).read();
            let mut out: Array<Exclusion> = array![];
            let mut i: u32 = 0;
            while i < count {
                out.append(self.exclusions.entry((group_id, i)).read());
                i += 1;
            }
            out
        }

        fn get_ciphertext(self: @ContractState, group_id: u64, index: u32) -> ByteArray {
            self.ciphertexts.entry((group_id, index)).read()
        }

        fn get_commitments(self: @ContractState, group_id: u64) -> Array<felt252> {
            let g = self.group_or_panic(group_id);
            let mut out: Array<felt252> = array![];
            if g.status < status::DRAWN {
                return out;
            }
            let n = self.participant_count.entry(group_id).read();
            let mut i: u32 = 0;
            while i < n {
                out.append(self.commitments.entry((group_id, i)).read());
                i += 1;
            }
            out
        }

        fn get_sealed_reveal(self: @ContractState, group_id: u64) -> ByteArray {
            self.sealed_reveal.entry(group_id).read()
        }

        fn get_reveal(self: @ContractState, group_id: u64) -> (Array<u32>, Array<felt252>) {
            let g = self.group_or_panic(group_id);
            let mut receivers: Array<u32> = array![];
            let mut salts: Array<felt252> = array![];
            if g.status != status::REVEALED {
                return (receivers, salts);
            }
            let n = self.participant_count.entry(group_id).read();
            let mut i: u32 = 0;
            while i < n {
                receivers.append(self.reveal_receivers.entry((group_id, i)).read());
                salts.append(self.reveal_salts.entry((group_id, i)).read());
                i += 1;
            }
            (receivers, salts)
        }

        fn get_key_versions(self: @ContractState, group_id: u64, index: u32) -> (u32, u32) {
            (
                self.key_version.entry((group_id, index)).read(),
                self.ct_version.entry((group_id, index)).read(),
            )
        }

        fn groups_of_admin(self: @ContractState, account: ContractAddress) -> Array<u64> {
            let v = self.groups_of_admin.entry(account);
            let mut out: Array<u64> = array![];
            let mut i: u64 = 0;
            let len = v.len();
            while i < len {
                out.append(v.at(i).read());
                i += 1;
            }
            out
        }

        fn groups_of_participant(self: @ContractState, account: ContractAddress) -> Array<u64> {
            let v = self.groups_of_participant.entry(account);
            let mut out: Array<u64> = array![];
            let mut i: u64 = 0;
            let len = v.len();
            while i < len {
                out.append(v.at(i).read());
                i += 1;
            }
            out
        }

        fn verify_commitment(
            self: @ContractState, group_id: u64, index: u32, receiver: u32, salt: felt252,
        ) -> bool {
            commitment_of(group_id, index, receiver, salt)
                == self.commitments.entry((group_id, index)).read()
        }
    }

    /// commitment_i = poseidon(group_id, i, receiver, salt) — igual que lib/crypto/commitments.ts
    pub fn commitment_of(group_id: u64, index: u32, receiver: u32, salt: felt252) -> felt252 {
        poseidon_hash_span(array![group_id.into(), index.into(), receiver.into(), salt].span())
    }

    #[generate_trait]
    impl Internal of InternalTrait {
        fn only_operator(self: @ContractState) {
            assert(get_caller_address() == self.operator.read(), errors::NOT_OPERATOR);
        }

        fn group_or_panic(self: @ContractState, group_id: u64) -> Group {
            let g = self.groups.entry(group_id).read();
            assert(g.admin.is_non_zero(), errors::NO_GROUP);
            g
        }

        fn admin_group(self: @ContractState, group_id: u64) -> Group {
            let g = self.group_or_panic(group_id);
            assert(get_caller_address() == g.admin, errors::NOT_ADMIN);
            g
        }

        fn ensure_live(self: @ContractState, group_id: u64) {
            assert(!self.archived.entry(group_id).read(), errors::ARCHIVED);
        }

        fn is_excluded(self: @ContractState, group_id: u64, a: u32, b: u32) -> bool {
            let count = self.exclusion_count.entry(group_id).read();
            let mut i: u32 = 0;
            let mut found = false;
            while i < count {
                let e = self.exclusions.entry((group_id, i)).read();
                if (e.a == a && e.b == b) || (e.a == b && e.b == a) {
                    found = true;
                    break;
                }
                i += 1;
            }
            found
        }

        fn store_new_group(
            ref self: ContractState,
            admin: ContractAddress,
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
        ) -> u64 {
            assert(name.len() > 0, errors::NAME_REQUIRED);
            assert(budget_max >= budget_min, errors::BAD_BUDGET);
            assert(expected_count >= MIN_PARTICIPANTS, errors::TOO_FEW);
            assert(invite_code != 0, errors::INVITE_REQUIRED);
            let id = self.next_group_id.read();
            self.next_group_id.write(id + 1);
            let g = Group {
                admin,
                name,
                event_at,
                place,
                budget_min,
                budget_max,
                currency,
                rules,
                expected_count,
                invite_code,
                previous_group_id,
                avoid_previous: previous_group_id != 0,
                status: status::OPEN,
                drawn_at: 0,
                revealed_at: 0,
            };
            self.groups.entry(id).write(g);
            self.groups_of_admin.entry(admin).push(id);
            self.emit(GroupCreated { group_id: id, admin, previous_group_id });
            id
        }
    }
}
