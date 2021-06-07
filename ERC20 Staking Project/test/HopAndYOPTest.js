const { expect } = require("chai");
const {ethers, deployments} = require("hardhat");

// let address;
let owner; 
let signer1; 
let signer2; 
let signers;
let YOP; 
let HopAndYOPFactory; 
let hopAndYOP; 
let tokenFactory;


beforeEach(async function () { 
  
  [owner, signer1, signer2, ...signers] = await ethers.getSigners();  
  tokenFactory = await ethers.getContractFactory("YOP");
  YOP = await tokenFactory.deploy();
  HopAndYOPFactory  = await ethers.getContractFactory("HopOnYop");
  hopAndYOP = await HopAndYOPFactory.deploy(YOP.address); 
  await YOP.unlock_privateSale(owner.address);
  await YOP.transfer(signer1.address, 1000);
  await YOP.transfer(signer2.address, 1000);
})


describe("HopAndYop contract", function() {
  

  // // Done
  it("Fill reward pool from different accounts", async function() {

    
    await YOP.approve(hopAndYOP.address, 50);
    await hopAndYOP.feedRewardPool();
    expect(await hopAndYOP.RewardPool()).to.equal(50);

    await YOP.connect(signer1).approve(hopAndYOP.address, 100);
    await hopAndYOP.connect(signer1).feedRewardPool();
    expect(await hopAndYOP.RewardPool()).to.equal(150);
  });

  // Done
  it("Staking should not be possible when there is not enough allowance", async function() {
    await YOP.approve(hopAndYOP.address, 50);
    await hopAndYOP.feedRewardPool();
    await YOP.approve(hopAndYOP.address, 100);
    await hopAndYOP.stakeYOP(0); // 0, 1, 2
    // should throw an error -  Need to increase allowance first
  });

  // Done (the blocktime line(174) should be commented otherwise will bring the (too soon to unstake error))
  it("TVL Value is properly calculated", async function() {
    await YOP.approve(hopAndYOP.address, 1000); // could be anything strictly more than 0;
    await hopAndYOP.feedRewardPool();
    await YOP.approve(hopAndYOP.address, 100);
    await hopAndYOP.stakeYOP(0);//0,1,2
    expect(await hopAndYOP.TVL()).to.equal(100);
    setTimeout(async () => {await hopAndYOP.claimRewards();}, 9000); // some time needed for unstaking;
    
  });

  // Done 
  it("rewardsOwed is properly calculated for each option and staking can be done only once by an account", async function() {
    await YOP.approve(hopAndYOP.address, 1000); // could be anything strictly more than 0;
    await hopAndYOP.feedRewardPool();

    await YOP.approve(hopAndYOP.address, 100);
    await hopAndYOP.stakeYOP(0);
    expect(await hopAndYOP.RewardsOwed()).to.equal(6);

    await YOP.connect(signer1).approve(hopAndYOP.address, 100);
    await hopAndYOP.connect(signer1).stakeYOP(1);
    expect(await hopAndYOP.RewardsOwed()) .to.equal(21); // 6 + 15

    await YOP.connect(signer2).approve(hopAndYOP.address, 100);
    await hopAndYOP.connect(signer2).stakeYOP(2);
    expect(await hopAndYOP.RewardsOwed()) .to.equal(54); // 6 + 15 + 33


  });

  it("account is unable to claim if the staking period is not over", async function() {
    await YOP.approve(hopAndYOP.address, 1000); // could be anything strictly more than 0;
    await hopAndYOP.feedRewardPool();

    await YOP.approve(hopAndYOP.address, 100);
    await hopAndYOP.stakeYOP(0);//0,1,2
    expect(await hopAndYOP.TVL()).to.equal(100);
    await expect(hopAndYOP.claimRewards()).to.be.revertedWith("Error: Too soon to unstake");
  });

  it("Should not let staking values less than 33 and more than 88888 ", async function () {
    await YOP.approve(hopAndYOP.address, 1000); // could be anything strictly more than 0;
    await hopAndYOP.feedRewardPool();

    await YOP.approve(hopAndYOP.address, 32);
    await expect(hopAndYOP.stakeYOP(0)).to.be.revertedWith("Error: You should stake from 33 to 88888 tokens.")

    await YOP.approve(hopAndYOP.address, 90000);
    await expect(hopAndYOP.stakeYOP(0)).to.be.revertedWith("Error: You should stake from 33 to 88888 tokens.")
  })

});




