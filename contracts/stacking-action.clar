
;; title: Stacking Action
;; version: 1.0.0
;; summary: A simple test of delegation through a contract.
;; description: NOT AUDITED - USE AT YOUR OWN RISK

;; constants

(define-constant ADMIN tx-sender)
(define-constant SELF (as-contract tx-sender))
(define-constant ERR_UNAUTHORIZED (err u1000))
(define-constant ERR_INVALID_PARAMS (err u1001))

;; public functions

(define-public (stack-stx (amount uint) (to principal) (poxVer (buff 1)) (poxHash (buff 20)) (until (optional uint)))
  (begin
    (try! (is-authorized))
    (print {
      event: "stack-stx",
      amount: amount,
      caller: contract-caller,
      delegate: to,
      pox-addr: { version: poxVer, hashbytes: poxHash},
      sender: tx-sender,
      until: until
    })
    (match (as-contract (contract-call? 'SP000000000000000000002Q6VF78.pox delegate-stx amount to until (some { version: poxVer, hashbytes: poxHash})))
      success (ok success)
      err (err (to-uint err))
    )
  )
)

(define-public (unstack-stx)
  (begin
    (try! (is-authorized))
    (print {
      event: "unstack-stx",
      caller: contract-caller,
      sender: tx-sender
    })
    (match (as-contract (contract-call? 'SP000000000000000000002Q6VF78.pox revoke-delegate-stx))
      success (ok success)
      err (err (to-uint err))
    )
  )
)

(define-public (withdraw-stx (to principal) (amount uint))
  (begin
    (try! (is-authorized))
    (asserts! (and (> u0 amount) (>= (get-balance) amount)) ERR_INVALID_PARAMS)
    (print {
      event: "withdraw-stx",
      amount: amount,
      caller: contract-caller,
      sender: tx-sender
    })
    (as-contract (stx-transfer? amount tx-sender to))
  )
)

;; read only functions

(define-read-only (get-balance)
  (stx-get-balance SELF)
)

;; private functions

(define-private (is-authorized)
  (ok (asserts! (is-eq contract-caller ADMIN) ERR_UNAUTHORIZED))
)
