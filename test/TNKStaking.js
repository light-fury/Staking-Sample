const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TNKStaking", function () {
  let owner;
  let alice;
  let bob;
  let tnkToken;
  let tnkStaking;
  before(async function () {
    [owner, alice, bob] = await ethers.getSigners();

    const TNKToken = await ethers.getContractFactory("TNKToken");
    tnkToken = await TNKToken.deploy();
    await tnkToken.deployed();

    const TNKStaking = await ethers.getContractFactory("TNKStaking");
    tnkStaking = await TNKStaking.deploy(tnkToken.address, owner.address);
    await tnkStaking.deployed();

    await tnkToken
      .connect(owner)
      .transfer(alice.address, ethers.utils.parseUnits("1000000", 18));
    await tnkToken
      .connect(owner)
      .transfer(bob.address, ethers.utils.parseUnits("1000000", 18));
  });
  it("Distribution restrictions", async function () {
    await tnkToken
      .connect(owner)
      .approve(tnkStaking.address, ethers.utils.parseUnits("500000", 18));
    expect(
      tnkStaking
        .connect(owner)
        .distributeReward(ethers.utils.parseUnits("500000", 18))
    ).to.be.revertedWith("No available stakers");
    expect(
      tnkStaking
        .connect(alice)
        .distributeReward(ethers.utils.parseUnits("500000", 18))
    ).to.be.revertedWith("Distributor not authorized");
  });
  it("Stake TNK token from Alice and Bob", async function () {
    await tnkToken
      .connect(alice)
      .approve(tnkStaking.address, ethers.utils.parseUnits("800000", 18));
    await tnkStaking
      .connect(alice)
      .stakeTNK(ethers.utils.parseUnits("800000", 18));
    await tnkToken
      .connect(bob)
      .approve(tnkStaking.address, ethers.utils.parseUnits("200000", 18));
    await tnkStaking
      .connect(bob)
      .stakeTNK(ethers.utils.parseUnits("200000", 18));

    const unstakeableAmt = await tnkStaking.connect(alice).unstakeableTNK();
    expect(unstakeableAmt).to.equal(ethers.utils.parseUnits("800000", 18));
    const releasableAmt = await tnkStaking.connect(alice).releasableReward();
    expect(releasableAmt).to.equal(0);

    const unstakeableAmtBob = await tnkStaking.connect(bob).unstakeableTNK();
    expect(unstakeableAmtBob).to.equal(ethers.utils.parseUnits("200000", 18));
    const releasableAmtBob = await tnkStaking.connect(bob).releasableReward();
    expect(releasableAmtBob).to.equal(0);
  });
  it("Distribute reward TNK token to Alice and Bob", async function () {
    await tnkToken
      .connect(owner)
      .approve(tnkStaking.address, ethers.utils.parseUnits("500000", 18));
    await tnkStaking
      .connect(owner)
      .distributeReward(ethers.utils.parseUnits("500000", 18));

    const unstakeableAmt = await tnkStaking.connect(alice).unstakeableTNK();
    expect(unstakeableAmt).to.equal(ethers.utils.parseUnits("800000", 18));
    const releasableAmt = await tnkStaking.connect(alice).releasableReward();
    expect(releasableAmt).to.equal(ethers.utils.parseUnits("400000", 18));

    const unstakeableAmtBob = await tnkStaking.connect(bob).unstakeableTNK();
    expect(unstakeableAmtBob).to.equal(ethers.utils.parseUnits("200000", 18));
    const releasableAmtBob = await tnkStaking.connect(bob).releasableReward();
    expect(releasableAmtBob).to.equal(ethers.utils.parseUnits("100000", 18));
  });
  it("Unstake partial TNK from Alice", async function () {
    const aliceBalance = await tnkToken.balanceOf(alice.address);
    await tnkStaking
      .connect(alice)
      .unstakeTNK(ethers.utils.parseUnits("500000", 18));
    const aliceBalanceLater = await tnkToken.balanceOf(alice.address);
    expect(aliceBalanceLater).to.equal(
      aliceBalance.add(ethers.utils.parseUnits("750000", 18))
    );

    const unstakeableAmt = await tnkStaking.connect(alice).unstakeableTNK();
    expect(unstakeableAmt).to.equal(ethers.utils.parseUnits("300000", 18));
    const releasableAmt = await tnkStaking.connect(alice).releasableReward();
    expect(releasableAmt).to.equal(ethers.utils.parseUnits("150000", 18));

    const unstakeableAmtBob = await tnkStaking.connect(bob).unstakeableTNK();
    expect(unstakeableAmtBob).to.equal(ethers.utils.parseUnits("200000", 18));
    const releasableAmtBob = await tnkStaking.connect(bob).releasableReward();
    expect(releasableAmtBob).to.equal(ethers.utils.parseUnits("100000", 18));
  });

  it("Distribute reward TNK token to Alice and Bob - 2nd round", async function () {
    await tnkToken
      .connect(owner)
      .approve(tnkStaking.address, ethers.utils.parseUnits("500000", 18));
    await tnkStaking
      .connect(owner)
      .distributeReward(ethers.utils.parseUnits("500000", 18));

    const unstakeableAmt = await tnkStaking.connect(alice).unstakeableTNK();
    expect(unstakeableAmt).to.equal(ethers.utils.parseUnits("300000", 18));
    const releasableAmt = await tnkStaking.connect(alice).releasableReward();
    expect(releasableAmt).to.equal(ethers.utils.parseUnits("450000", 18));

    const unstakeableAmtBob = await tnkStaking.connect(bob).unstakeableTNK();
    expect(unstakeableAmtBob).to.equal(ethers.utils.parseUnits("200000", 18));
    const releasableAmtBob = await tnkStaking.connect(bob).releasableReward();
    expect(releasableAmtBob).to.equal(ethers.utils.parseUnits("300000", 18));
  });
  it("Unstake all TNK from Bob", async function () {
    const bobBalance = await tnkToken.balanceOf(bob.address);
    expect(
      tnkStaking.connect(bob).unstakeTNK(ethers.utils.parseUnits("400000", 18))
    ).to.be.revertedWith("Not enough TNK token to unstake");
    await tnkStaking
      .connect(bob)
      .unstakeTNK(ethers.utils.parseUnits("200000", 18));
    const bobBalanceLater = await tnkToken.balanceOf(bob.address);
    expect(bobBalanceLater).to.equal(
      bobBalance.add(ethers.utils.parseUnits("500000", 18))
    );

    const unstakeableAmt = await tnkStaking.connect(alice).unstakeableTNK();
    expect(unstakeableAmt).to.equal(ethers.utils.parseUnits("300000", 18));
    const releasableAmt = await tnkStaking.connect(alice).releasableReward();
    expect(releasableAmt).to.equal(ethers.utils.parseUnits("450000", 18));

    const unstakeableAmtBob = await tnkStaking.connect(bob).unstakeableTNK();
    expect(unstakeableAmtBob).to.equal(0);
    const releasableAmtBob = await tnkStaking.connect(bob).releasableReward();
    expect(releasableAmtBob).to.equal(0);
  });
  it("Stake TNK token from Alice - 2nd Round", async function () {
    const aliceBalance = await tnkToken.balanceOf(alice.address);
    expect(tnkStaking.connect(alice).releaseLockedTNK()).to.be.revertedWith(
      "Not enough TNK token to withdraw"
    );
    await tnkToken
      .connect(alice)
      .approve(tnkStaking.address, ethers.utils.parseUnits("500000", 18));
    await tnkStaking
      .connect(alice)
      .stakeTNK(ethers.utils.parseUnits("500000", 18));
    const aliceBalanceLater = await tnkToken.balanceOf(alice.address);
    expect(aliceBalanceLater).to.equal(
      aliceBalance.sub(ethers.utils.parseUnits("500000", 18))
    );

    const unstakeableAmt = await tnkStaking.connect(alice).unstakeableTNK();
    expect(unstakeableAmt).to.equal(ethers.utils.parseUnits("500000", 18));
    const releasableAmt = await tnkStaking.connect(alice).releasableReward();
    expect(releasableAmt).to.equal(0);
    const lockedAmt = await tnkStaking.connect(alice).lockedTNK();
    expect(lockedAmt).to.equal(ethers.utils.parseUnits("750000", 18));
    await tnkStaking.connect(alice).releaseLockedTNK();
    const aliceBalanceAfterLocked = await tnkToken.balanceOf(alice.address);
    expect(aliceBalanceAfterLocked).to.equal(
      aliceBalanceLater.add(ethers.utils.parseUnits("750000", 18))
    );

    const unstakeableAmtBob = await tnkStaking.connect(bob).unstakeableTNK();
    expect(unstakeableAmtBob).to.equal(0);
    const releasableAmtBob = await tnkStaking.connect(bob).releasableReward();
    expect(releasableAmtBob).to.equal(0);
  });
});
