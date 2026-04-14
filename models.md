# Toybrary Data Model

## Overview

A toy library app for a nonprofit with a single physical exchange site. Members request toys, schedule pickup and return timeframes, and admins process exchanges in person.

---

## Conventions

All models include the following fields by convention. They are not listed individually in each model below.

| Field | Type | Notes |
|-------|------|-------|
| created_at | timestamp | set on insert |
| updated_at | timestamp | set on update |
| created_by | uuid | FK → User; the user who created the record |

---

## Models

### User
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| name | string | |
| email | string | |
| phone | string | |
| address_line1 | string | |
| address_line2 | string | nullable |
| city | string | |
| state | string | |
| zip | string | |
password hash?  We need some way to authenticate users

---

### Role
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| name | string | e.g. `member`, `admin` |

---

### UserRole
Join table linking users to roles. A user can have multiple roles.

| Field | Type | Notes |
|-------|------|-------|
| user_id | uuid | FK → User |
| role_id | uuid | FK → Role |


---

### MembershipRequest
Submitted by a user to apply for a library membership. Reviewed and approved or denied by an admin.

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → User |
| reviewed_by | uuid | FK → User (admin); nullable |
| reviewed_at | timestamp | nullable |
| status | enum | `pending`, `approved`, `denied` |
| notes | string | nullable |
| created_at | timestamp | |

---

### Membership
Created when a MembershipRequest is approved. Supports multiple users (e.g. families) via MembershipUser.

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| membership_request_id | uuid | FK → MembershipRequest |
| start_date | date | |
| end_date | date | defaults to 1 year from start_date |
| account_standing | enum | `active`, `banned`, `temporary_hold` |

---

### MembershipUser
Join table linking users to a membership.

| Field | Type | Notes |
|-------|------|-------|
| membership_id | uuid | FK → Membership |
| user_id | uuid | FK → User |

---

### Toy
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| name | string | |
| description | string | |
| brand | string | nullable |
| link | string | nullable |
| battery_operated | boolean | |
| shareable | boolean | |
| age_min | integer | nullable |
| age_max | integer | nullable |
| piece_count | integer | nullable |

---

### ToyImage
Images for a toy. Any number can be flagged as featured for prominent display.

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| toy_id | uuid | FK → Toy |
| image_url | string | |
| is_featured | boolean | multiple allowed |

---

### Tag
Enum-like labels for toys (e.g. building, learning, art). Stored as a table for admin flexibility.

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| name | string | |

---

### ToyTag
Join table linking toys to tags.

| Field | Type | Notes |
|-------|------|-------|
| toy_id | uuid | FK → Toy |
| tag_id | uuid | FK → Tag |

---

### Timeframe
A scheduled exchange window created by an admin. Admins publish these on a rolling ~30-day basis.

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| created_by | uuid | FK → User (admin) |
| start_time | timestamp | |
| end_time | timestamp | |
| notes | string | nullable |

---

### Request
A member's request to borrow a specific toy. Created by the member; no admin approval required. A checkout is created by the admin at the physical exchange.

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| toy_id | uuid | FK → Toy |
| membership_id | uuid | FK → Membership |
| created_at | timestamp | |

---

### CheckoutTimeframe
Records a member's selected pickup timeframe for a request. Optional at time of request — can be added later. Supports rescheduling via status history (cancel one, create another).

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| request_id | uuid | FK → Request |
| timeframe_id | uuid | FK → Timeframe |
| status | enum | `scheduled`, `completed`, `no_show`, `cancelled` |
| created_at | timestamp | |

---

### Checkout
Created by the admin at the exchange. Captures the member taking the toy, the membership responsible, and optionally the request it originated from (nullable for walk-ins).

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| toy_id | uuid | FK → Toy |
| membership_id | uuid | FK → Membership |
| user_id | uuid | FK → User (member taking the toy) |
| request_id | uuid | FK → Request; nullable |
| checked_out_at | timestamp | |
| due_at | timestamp | |
| returned_at | timestamp | nullable; null means toy is still out |

---

### ReturnTimeframe
Records a member's selected return timeframe for a checkout. Optional — can be scheduled at pickup or later by the member. Supports rescheduling via status history.

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| checkout_id | uuid | FK → Checkout |
| timeframe_id | uuid | FK → Timeframe |
| status | enum | `scheduled`, `completed`, `no_show`, `cancelled` |
| created_at | timestamp | |

---

## Relationships

| From | To | Cardinality | Notes |
|------|----|-------------|-------|
| User | MembershipRequest | one-to-many | user submits requests |
| User | MembershipRequest | one-to-many | admin reviews requests (reviewed_by) |
| User | MembershipUser | one-to-many | |
| User | Timeframe | one-to-many | admin creates timeframes |
| MembershipRequest | Membership | one-to-one | approval creates membership |
| Membership | MembershipUser | one-to-many | |
| Membership | Request | one-to-many | |
| Toy | ToyImage | one-to-many | |
| Toy | ToyTag | one-to-many | |
| Tag | ToyTag | one-to-many | |
| Toy | Request | one-to-many | |
| Request | CheckoutTimeframe | one-to-many | supports rescheduling history |
| Request | Checkout | one-to-one | |
| Timeframe | CheckoutTimeframe | one-to-many | |
| Checkout | ReturnTimeframe | one-to-many | supports rescheduling history |
| Timeframe | ReturnTimeframe | one-to-many | |

---

## End-to-End Flow

1. **Sign up** — User created with role `member`.
2. **Apply for membership** — MembershipRequest submitted with status `pending`.
3. **Admin approves** — Admin sets status to `approved`, Membership record created linked to the request.
4. **Request a toy** — Member creates a Request for a toy. Optionally creates a CheckoutTimeframe to select a pickup window.
5. **Pickup exchange** — Member arrives at the exchange site. Admin marks CheckoutTimeframe as `completed` and creates a Checkout.
6. **Schedule return** — Member creates a ReturnTimeframe linked to their Checkout, selecting an available window.
7. **Return exchange** — Member returns toy. Admin marks ReturnTimeframe as `completed` and sets `returned_at` on the Checkout.

---

## Key Derivations (business logic, not stored)

- **Toy availability** — toy has no Checkout where `returned_at` is null.
- **Overdue toys** — any Checkout where `returned_at` is null and `due_date` has passed.
- **Active membership** — Membership where `account_standing = active` and `end_date` is in the future.
- **Current pickup timeframe** — most recent CheckoutTimeframe for a Request where status is not `cancelled`.
- **Current return timeframe** — most recent ReturnTimeframe for a Checkout where status is not `cancelled`.
