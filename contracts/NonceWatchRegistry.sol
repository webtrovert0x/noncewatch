// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NonceWatchRegistry
 * @dev On-Chain Transaction Nonce & Sequencing Problem Investigation Registry for BOT Chain.
 * Every investigation and anomaly report is recorded on-chain via state-changing transactions
 * that require standard network gas fees (gas fee only, no protocol tax/surcharge).
 */
contract NonceWatchRegistry {

    enum AnomalyType {
        HEALTHY,                // 0: Perfect sequencing, no gaps or conflicts
        PENDING_BACKLOG,        // 1: Pending transactions queued consecutively
        NONCE_GAP_DETECTED,     // 2: Nonce gap detected (missing nonce blocking queue)
        REPLACEMENT_CONFLICT,   // 3: Same nonce used with competing gas/hash
        STUCK_TRANSACTION       // 4: Low gas or pending timeout
    }

    struct Investigation {
        uint256 id;
        address targetWallet;
        address inspector;
        uint256 latestNonce;
        uint256 pendingNonce;
        AnomalyType statusFlag;
        string diagnosisCode;
        string developerNote;
        uint256 timestamp;
        uint256 blockNumber;
        bool resolved;
    }

    struct NonceCheckpoint {
        uint256 verifiedNonce;
        uint256 recordedAt;
        address verifiedBy;
    }

    // Storage
    uint256 private _investigationCounter;
    mapping(uint256 => Investigation) private _investigations;
    mapping(address => uint256[]) private _walletToInvestigationIds;
    mapping(address => uint256[]) private _inspectorToInvestigationIds;
    mapping(address => NonceCheckpoint) private _latestCheckpoints;
    mapping(address => uint256) private _walletAnomalyCount;

    // Events
    event InspectionRequested(
        uint256 indexed id,
        address indexed targetWallet,
        address indexed requester,
        uint256 timestamp
    );

    event InvestigationRecorded(
        uint256 indexed id,
        address indexed targetWallet,
        address indexed inspector,
        uint256 latestNonce,
        uint256 pendingNonce,
        AnomalyType statusFlag,
        string diagnosisCode,
        uint256 timestamp
    );

    event SequencingAnomalyFlagged(
        uint256 indexed id,
        address indexed targetWallet,
        address indexed reporter,
        uint256 missingNonce,
        AnomalyType anomalyType,
        string details,
        uint256 timestamp
    );

    event InvestigationStatusUpdated(
        uint256 indexed id,
        address indexed updater,
        bool resolved,
        string resolutionNote,
        uint256 timestamp
    );

    event NonceCheckpointVerified(
        address indexed targetWallet,
        address indexed verifier,
        uint256 verifiedNonce,
        uint256 timestamp
    );

    // Custom errors
    error InvalidWalletAddress();
    error InvestigationNotFound(uint256 id);
    error UnauthorizedUpdater();

    /**
     * @notice Records an account nonce inspection request on BOT Chain.
     * @dev State-changing execution requiring standard network gas fee only (0 BOT protocol fee).
     * @param targetWallet The wallet address to inspect.
     * @return id The unique ID of the recorded inspection request.
     */
    function requestInspection(address targetWallet) external returns (uint256 id) {
        if (targetWallet == address(0)) revert InvalidWalletAddress();

        id = ++_investigationCounter;

        _investigations[id] = Investigation({
            id: id,
            targetWallet: targetWallet,
            inspector: msg.sender,
            latestNonce: 0,
            pendingNonce: 0,
            statusFlag: AnomalyType.HEALTHY,
            diagnosisCode: "INSPECTION_REQUESTED",
            developerNote: "Inspection request recorded on-chain via NonceWatch",
            timestamp: block.timestamp,
            blockNumber: block.number,
            resolved: false
        });

        _walletToInvestigationIds[targetWallet].push(id);
        _inspectorToInvestigationIds[msg.sender].push(id);

        emit InspectionRequested(id, targetWallet, msg.sender, block.timestamp);
    }

    /**
     * @notice Records an account nonce investigation on BOT Chain.
     * @dev State-changing execution requiring standard network gas fee only.
     * @param targetWallet The wallet address inspected.
     * @param latestNonce Latest confirmed nonce from BOT Chain.
     * @param pendingNonce Pending nonce from BOT Chain.
     * @param statusFlag Categorized anomaly status.
     * @param diagnosisCode Diagnostic short code (e.g. "GAP_N7", "BACKLOG_3", "HEALTHY").
     * @param developerNote Diagnostic explanation or developer log.
     * @return id The unique ID of the recorded investigation.
     */
    function recordInvestigation(
        address targetWallet,
        uint256 latestNonce,
        uint256 pendingNonce,
        AnomalyType statusFlag,
        string calldata diagnosisCode,
        string calldata developerNote
    ) external returns (uint256 id) {
        if (targetWallet == address(0)) revert InvalidWalletAddress();

        id = ++_investigationCounter;

        _investigations[id] = Investigation({
            id: id,
            targetWallet: targetWallet,
            inspector: msg.sender,
            latestNonce: latestNonce,
            pendingNonce: pendingNonce,
            statusFlag: statusFlag,
            diagnosisCode: diagnosisCode,
            developerNote: developerNote,
            timestamp: block.timestamp,
            blockNumber: block.number,
            resolved: (statusFlag == AnomalyType.HEALTHY)
        });

        _walletToInvestigationIds[targetWallet].push(id);
        _inspectorToInvestigationIds[msg.sender].push(id);

        if (statusFlag != AnomalyType.HEALTHY) {
            _walletAnomalyCount[targetWallet]++;
        }

        emit InvestigationRecorded(
            id,
            targetWallet,
            msg.sender,
            latestNonce,
            pendingNonce,
            statusFlag,
            diagnosisCode,
            block.timestamp
        );
    }

    /**
     * @notice Specifically flags a transaction sequencing anomaly (e.g. missing nonce blocking queue).
     * @dev State-changing execution requiring standard network gas fee only.
     * @param targetWallet Target address with the stuck or anomalous sequence.
     * @param missingNonce Specific missing nonce causing the sequence gap.
     * @param anomalyType Category of the problem.
     * @param details Additional technical context.
     * @return id The investigation record ID created.
     */
    function flagSequencingAnomaly(
        address targetWallet,
        uint256 missingNonce,
        AnomalyType anomalyType,
        string calldata details
    ) external returns (uint256 id) {
        if (targetWallet == address(0)) revert InvalidWalletAddress();

        id = ++_investigationCounter;

        _investigations[id] = Investigation({
            id: id,
            targetWallet: targetWallet,
            inspector: msg.sender,
            latestNonce: missingNonce > 0 ? missingNonce - 1 : 0,
            pendingNonce: missingNonce + 1,
            statusFlag: anomalyType,
            diagnosisCode: "FLAGGED_ANOMALY",
            developerNote: details,
            timestamp: block.timestamp,
            blockNumber: block.number,
            resolved: false
        });

        _walletToInvestigationIds[targetWallet].push(id);
        _inspectorToInvestigationIds[msg.sender].push(id);
        _walletAnomalyCount[targetWallet]++;

        emit SequencingAnomalyFlagged(
            id,
            targetWallet,
            msg.sender,
            missingNonce,
            anomalyType,
            details,
            block.timestamp
        );
    }

    /**
     * @notice Mark an investigation as resolved (e.g., after submitting a gap-filler or replacement tx).
     * @dev State-changing execution requiring standard network gas fee only.
     * @param id The investigation record ID.
     * @param resolved Status boolean.
     * @param resolutionNote Explanation of how the sequence was unblocked.
     */
    function updateInvestigationStatus(
        uint256 id,
        bool resolved,
        string calldata resolutionNote
    ) external {
        if (id == 0 || id > _investigationCounter) revert InvestigationNotFound(id);
        Investigation storage inv = _investigations[id];

        // Inspector or any developer can update with resolution note
        inv.resolved = resolved;
        if (bytes(resolutionNote).length > 0) {
            inv.developerNote = string(abi.encodePacked(inv.developerNote, " | Resolution: ", resolutionNote));
        }

        emit InvestigationStatusUpdated(id, msg.sender, resolved, resolutionNote, block.timestamp);
    }

    /**
     * @notice Anchors a verified nonce checkpoint for an account on BOT Chain.
     * @dev State-changing execution requiring standard network gas fee only.
     * @param targetWallet Address whose nonce is verified.
     * @param verifiedNonce The verified on-chain confirmed nonce.
     */
    function verifyNonceCheckpoint(
        address targetWallet,
        uint256 verifiedNonce
    ) external {
        if (targetWallet == address(0)) revert InvalidWalletAddress();

        _latestCheckpoints[targetWallet] = NonceCheckpoint({
            verifiedNonce: verifiedNonce,
            recordedAt: block.timestamp,
            verifiedBy: msg.sender
        });

        emit NonceCheckpointVerified(targetWallet, msg.sender, verifiedNonce, block.timestamp);
    }

    // --- VIEW / QUERY FUNCTIONS ---

    function totalInvestigations() external view returns (uint256) {
        return _investigationCounter;
    }

    function getInvestigation(uint256 id) external view returns (Investigation memory) {
        if (id == 0 || id > _investigationCounter) revert InvestigationNotFound(id);
        return _investigations[id];
    }

    function getInvestigationsByWallet(address targetWallet) external view returns (uint256[] memory) {
        return _walletToInvestigationIds[targetWallet];
    }

    function getInvestigationsByInspector(address inspector) external view returns (uint256[] memory) {
        return _inspectorToInvestigationIds[inspector];
    }

    function getLatestCheckpoint(address targetWallet) external view returns (NonceCheckpoint memory) {
        return _latestCheckpoints[targetWallet];
    }

    function getWalletAnomalyCount(address targetWallet) external view returns (uint256) {
        return _walletAnomalyCount[targetWallet];
    }

    /**
     * @notice Returns batch of recent investigations for the UI explorer.
     * @param limit Max records to fetch.
     * @param offset Start index from the top (0 = newest).
     */
    function getRecentInvestigations(uint256 limit, uint256 offset) external view returns (Investigation[] memory) {
        uint256 total = _investigationCounter;
        if (total == 0 || offset >= total) {
            return new Investigation[](0);
        }

        uint256 available = total - offset;
        uint256 count = limit > available ? available : limit;
        Investigation[] memory results = new Investigation[](count);

        for (uint256 i = 0; i < count; i++) {
            uint256 id = total - offset - i;
            results[i] = _investigations[id];
        }

        return results;
    }
}

