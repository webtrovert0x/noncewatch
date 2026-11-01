const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NonceWatchRegistry Contract", function () {
  let registry;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("NonceWatchRegistry");
    registry = await Factory.deploy();
    await registry.waitForDeployment();
  });

  it("should initialize with 0 total investigations", async function () {
    expect(await registry.totalInvestigations()).to.equal(0);
  });

  it("should record an inspection request requiring gas fee only (no protocol fee)", async function () {
    const target = user2.address;
    const tx = await registry.connect(owner).requestInspection(target);
    const receipt = await tx.wait();
    expect(receipt.status).to.equal(1);

    expect(await registry.totalInvestigations()).to.equal(1);
    const inv = await registry.getInvestigation(1);
    expect(inv.targetWallet).to.equal(target);
    expect(inv.inspector).to.equal(owner.address);
    expect(inv.diagnosisCode).to.equal("INSPECTION_REQUESTED");
  });

  it("should record an investigation requiring gas fee only (no protocol fee)", async function () {
    const target = user1.address;
    const latestNonce = 5;
    const pendingNonce = 8;
    const statusFlag = 2; // NONCE_GAP_DETECTED
    const code = "GAP_N6";
    const note = "Missing nonce 6 between latest 5 and pending 8";

    // Transaction executes with 0 msg.value (gas fee only)
    const tx = await registry.connect(owner).recordInvestigation(
      target,
      latestNonce,
      pendingNonce,
      statusFlag,
      code,
      note
    );

    const receipt = await tx.wait();
    expect(receipt.status).to.equal(1);

    expect(await registry.totalInvestigations()).to.equal(1);

    const inv = await registry.getInvestigation(1);
    expect(inv.id).to.equal(1);
    expect(inv.targetWallet).to.equal(target);
    expect(inv.inspector).to.equal(owner.address);
    expect(inv.latestNonce).to.equal(latestNonce);
    expect(inv.pendingNonce).to.equal(pendingNonce);
    expect(inv.statusFlag).to.equal(statusFlag);
    expect(inv.diagnosisCode).to.equal(code);
    expect(inv.developerNote).to.equal(note);
    expect(inv.resolved).to.be.false;

    // Check mapping lookups
    const user1Invs = await registry.getInvestigationsByWallet(target);
    expect(user1Invs.length).to.equal(1);
    expect(user1Invs[0]).to.equal(1);

    const inspectorInvs = await registry.getInvestigationsByInspector(owner.address);
    expect(inspectorInvs.length).to.equal(1);
    expect(inspectorInvs[0]).to.equal(1);

    // Check anomaly counter
    expect(await registry.getWalletAnomalyCount(target)).to.equal(1);
  });

  it("should flag a sequencing anomaly (gas fee only)", async function () {
    const target = user2.address;
    const missingNonce = 12;
    const anomalyType = 2; // NONCE_GAP_DETECTED
    const details = "Nonce 12 missing while nonce 13, 14 are pending";

    const tx = await registry.connect(user1).flagSequencingAnomaly(
      target,
      missingNonce,
      anomalyType,
      details
    );
    await tx.wait();

    expect(await registry.totalInvestigations()).to.equal(1);
    const inv = await registry.getInvestigation(1);
    expect(inv.targetWallet).to.equal(target);
    expect(inv.inspector).to.equal(user1.address);
    expect(inv.latestNonce).to.equal(11);
    expect(inv.pendingNonce).to.equal(13);
    expect(inv.diagnosisCode).to.equal("FLAGGED_ANOMALY");
  });

  it("should update investigation status upon resolution", async function () {
    await registry.connect(owner).recordInvestigation(
      user1.address,
      2,
      4,
      2,
      "GAP_N3",
      "Stuck sequence"
    );

    const tx = await registry.connect(owner).updateInvestigationStatus(
      1,
      true,
      "Gap filled with 0-BOT self transfer at nonce 3"
    );
    await tx.wait();

    const inv = await registry.getInvestigation(1);
    expect(inv.resolved).to.be.true;
    expect(inv.developerNote).to.include("Resolution: Gap filled");
  });

  it("should verify and store nonce checkpoints (gas fee only)", async function () {
    await registry.connect(owner).verifyNonceCheckpoint(user1.address, 42);

    const checkpoint = await registry.getLatestCheckpoint(user1.address);
    expect(checkpoint.verifiedNonce).to.equal(42);
    expect(checkpoint.verifiedBy).to.equal(owner.address);
  });

  it("should fetch batch recent investigations", async function () {
    for (let i = 1; i <= 5; i++) {
      await registry.recordInvestigation(
        user1.address,
        i,
        i,
        0,
        "HEALTHY",
        `Check ${i}`
      );
    }

    const recent = await registry.getRecentInvestigations(3, 0);
    expect(recent.length).to.equal(3);
    expect(recent[0].id).to.equal(5);
    expect(recent[1].id).to.equal(4);
    expect(recent[2].id).to.equal(3);
  });
});

