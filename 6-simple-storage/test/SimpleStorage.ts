import '@typechain/hardhat'
import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { ethers } from 'hardhat'
import { SimpleStorage, SimpleStorage__factory } from '../typechain-types'

describe('SimpleStorage', () => {
  let simpleStorageFactory: SimpleStorage__factory, simpleStorage: SimpleStorage

  beforeEach(async () => {
    simpleStorageFactory = (await ethers.getContractFactory('SimpleStorage')) as SimpleStorage__factory
    simpleStorage = await simpleStorageFactory.deploy()
  })

  it('Should start with a favorite number of 0', async () => {
    const favoriteNumber = await simpleStorage.retrieve()
    expect(favoriteNumber).to.equal(0)
  })

  it('Should be able to set a new favorite number', async () => {
    const newNumber = 42
    const transactionResponse = await simpleStorage.store(newNumber)
    await transactionResponse.wait(1)
    const favoriteNumber = await simpleStorage.retrieve()
    expect(favoriteNumber).to.equal(newNumber)
  })

  it('Should be able to add a new person and her favorite number', async () => {
    const newNumber = 42
    const newName = 'Alice'
    const transactionResponse = await simpleStorage.addPerson(newName, newNumber)
    await transactionResponse.wait(1)
    const person = await simpleStorage.people(0)
    expect(person).to.deep.equal([BigNumber.from('42'), 'Alice'])
  })
})
