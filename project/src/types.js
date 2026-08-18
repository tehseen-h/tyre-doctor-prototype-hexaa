// TD One — domain types.
// Phase 1 is JS + JSDoc (no build step). PHASE 2: port these verbatim to src/types/*.ts.
// Every fixture in src/fixtures.js is shaped against these.

/** @typedef {'BNE'|'BLW'|'COB'|'KAL'|'LTN'|'MKY'|'MUS'|'WWY'} BranchCode */

/**
 * @typedef {Object} Branch
 * @property {BranchCode} code
 * @property {string} name
 * @property {string} region
 * @property {boolean} isHq
 */

/**
 * @typedef {Object} Customer
 * @property {string} id
 * @property {string} name
 * @property {number} ndtIntervalHours  // this customer's own NDT interval
 */

/**
 * @typedef {Object} Site
 * @property {string} id
 * @property {string} customerId
 * @property {string} name           // "Ridgeview Pit"
 * @property {string} label          // "Kurrajong Coal — Ridgeview Pit"
 */

/**
 * @typedef {Object} Photo
 * @property {string} id
 * @property {'serial_plate'|'damage'|'whole_tyre'|'cavity'|'repair'|'rim'|'crack'|'rejection'|'cert'} kind
 * @property {string} stage          // stage id the photo was captured at
 * @property {string} capturedBy
 * @property {string} capturedAt     // ISO-ish display string
 * @property {string} where          // site or branch label
 * @property {string} [note]
 * @property {boolean} [queued]      // waiting for signal
 */

/**
 * @typedef {Object} Asset
 * @property {string} id
 * @property {'tyre'|'rim'} kind
 * @property {string} serial            // tyre serial or rim manufacturer serial
 * @property {string} [customerAssetNo] // rims: R-4471
 * @property {string} [make]            // Bridgestone | Michelin | Goodyear
 * @property {string} [size]            // 40.00R57 | 53/80R63 ...
 * @property {string} [fleetNo]         // machine no
 * @property {number} [hoursAtRemoval]
 * @property {number} [nextNdtDueHours]
 * @property {AssetHistoryEntry[]} [history]
 */

/**
 * @typedef {Object} AssetHistoryEntry
 * @property {string} jobNo
 * @property {string} date
 * @property {string} outcome
 * @property {string} [category]
 */

/**
 * @typedef {Object} QuoteRef
 * @property {string} number            // EST-10482 — typed by a person, from NetSuite
 * @property {'Initial'|'Revised'|'Final'} status
 * @property {QuoteEvent[]} history
 */

/**
 * @typedef {Object} QuoteEvent
 * @property {'Initial'|'Revised'|'Final'} status
 * @property {string} at
 * @property {string} by
 * @property {string} [reason]
 * @property {string} [photoId]        // the photo that changed the quote
 */

/**
 * @typedef {Object} StageEvent
 * @property {string} from
 * @property {string} to
 * @property {string} by
 * @property {string} at
 * @property {Object<string,string|number|boolean>} [payload]
 * @property {Photo[]} [photos]
 * @property {string} [overrideReason]
 */

/**
 * @typedef {Object} RimFinding
 * @property {string} id
 * @property {'flange'|'bead_seat'|'gutter'|'disc'|'weld'} location
 * @property {string} type             // crack classification
 * @property {number} lengthMm
 * @property {number} x                // % across the schematic
 * @property {number} y                // % down the schematic
 * @property {string} [photoId]
 */

/**
 * @typedef {Object} Certificate
 * @property {string} number           // NDT-MKY-26-0311
 * @property {'ndt'|'repair'} kind
 * @property {string} issuedAt
 * @property {string} technician
 * @property {string} competencyUnit
 * @property {string} method
 * @property {number} [nextNdtDueHours]
 */

/**
 * @typedef {Object} Job
 * @property {string} jobNo            // MKY-TR-26-0417 | MKY-RJ-26-0132
 * @property {'tyre'|'rim'} rail
 * @property {BranchCode} branch
 * @property {string} customer
 * @property {string} site
 * @property {Asset} asset
 * @property {string} stage            // stage id from config/stages.js
 * @property {QuoteRef} [quote]
 * @property {'Minor'|'Intermediate'|'Major'} [category]
 * @property {'sidewall'|'tread'|'shoulder'|'bead'} [damagePosition]
 * @property {number} [damageSizeMm]
 * @property {boolean} [beltPlyDamage]
 * @property {number} [cookSeconds]        // recorded cook duration
 * @property {number} [cookRemaining]      // live countdown, oven only
 * @property {string} [repairUnit]
 * @property {boolean} [paused]            // escalated, waiting on sales
 * @property {string} [pauseReason]
 * @property {string} [outcome]
 * @property {string} [etaLabel]           // "On the way" bay
 * @property {string} [visitNo]
 * @property {StageEvent[]} events
 * @property {Photo[]} photos
 * @property {string} [ndtMethod]
 * @property {string} [technician]
 * @property {string} [competencyUnit]
 * @property {RimFinding[]} [findings]
 * @property {Certificate[]} [certificates]
 */

/**
 * @typedef {Object} SiteVisit
 * @property {string} visitNo          // SV-26-0088
 * @property {string} customer
 * @property {string} site
 * @property {string} date
 * @property {BranchCode} branch
 * @property {number} tyresAssessed
 * @property {number} repairable
 * @property {number} rejected
 * @property {string} [batchQuoteNo]
 * @property {Job[]} jobs
 */

/**
 * @typedef {Object} IntakeRow
 * @property {number} row
 * @property {string} customerAssetNo
 * @property {string} rimSerial
 * @property {string} size
 * @property {string} fleetNo
 * @property {string} hours            // raw as supplied (may be text/blank)
 * @property {string} removedOn        // raw as supplied
 * @property {'clean'|'held'} state
 * @property {IntakeProblem[]} problems
 */

/**
 * @typedef {Object} IntakeProblem
 * @property {'duplicate_asset'|'blank_serial'|'unknown_serial'|'size_typo'|'blank_hours'|'early_hours'|'overdue_hours'|'date_as_text'|'open_job'} code
 * @property {'customerAssetNo'|'rimSerial'|'size'|'hours'|'removedOn'} field
 * @property {string} message          // plain English, shown at the field
 * @property {boolean} needsHuman      // true → the needs-a-human queue
 */

/**
 * @typedef {Object} BranchReport
 * @property {BranchCode} branch
 * @property {number} minors
 * @property {number} intermediates
 * @property {number} majors
 * @property {number} jobsClosed
 * @property {number} manHours         // entered by hand — nobody captures labour digitally
 * @property {number} repairHours
 * @property {number} rejectionRate    // 0–1
 * @property {Object<string,number>} avgStageHours
 */

export const TYPES_VERSION = 1;
