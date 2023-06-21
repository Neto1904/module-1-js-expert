const { describe, it, before, beforeEach, afterEach } = require('mocha')
const { join } = require('path')
const { expect } = require('chai')
const sinon = require('sinon')
const Transaction = require('../../src/entities/transaction')
const CarService = require('../../src/services/carService')
const carsDatabase = join(process.cwd(), 'database', 'cars.json')

const mocks = {
    validCarCategory: require('../mocks/valid-carCategory.json'),
    validCar: require('../mocks/valid-car.json'),
    validCustomer: require('../mocks/valid-customer.json')
}

describe('Car service test suite', () => {
    let carService
    let sandbox

    before(() => {
        carService = new CarService({
            cars: carsDatabase
        })
    })

    beforeEach(() => {
        sandbox = sinon.createSandbox()
    })

    afterEach(() => {
        sandbox.restore()
    })

    it('should return a random position from an array', () => {
        const data = [0, 1, 2, 3, 4]
        const result = carService.getRandomPositionFromArray(data)
        expect(result).to.be.lte(data.length).and.be.gte(0)
    })

    it('should choose the first id from carIds in category', () => {
        const carCategory = mocks.validCarCategory
        const cadIdIndex = 0

        sandbox.stub(carService, carService.getRandomPositionFromArray.name).returns(cadIdIndex)

        const result = carService.chooseRandomCar(carCategory)
        const expected = carCategory.carIds[cadIdIndex]

        expect(carService.getRandomPositionFromArray.calledOnce).to.be.ok
        expect(result).to.be.equal(expected)
    })

    it('should return an available car given a car category', async () => {
        const car = mocks.validCar
        const carCategory = Object.create(mocks.validCarCategory)
        carCategory.carIds = [car.id]

        sandbox.stub(carService.carRepository, carService.carRepository.find.name).resolves(car)
        sandbox.spy(carService, carService.chooseRandomCar.name)

        const result = await carService.getAvailableCar(carCategory)
        const expected = car

        expect(carService.chooseRandomCar.calledOnce).to.be.ok
        expect(result).to.be.deep.equal(expected)
    })

    it('should calculate the final amount given the customer, number of days and the car category', async () => {
        const customer = Object.create(mocks.validCustomer)
        customer.age = 50

        const carCategory = Object.create(mocks.validCarCategory)
        carCategory.price = 37.6

        const numberOfDays = 5
        const result = carService.calculateFinalPrice(customer, carCategory, numberOfDays)

        sandbox.stub(carService, "taxesBasedOnAge")
            .get(() => [{ from: 40, to: 50, then: 1.3 }])

        const expected = carService.currencyFormat.format(244.40)

        expect(result).to.be.deep.equal(expected)
    })

    it('should return all info for a car rent', async () => {
        const car = mocks.validCar
        const carCategory = {
            ...mocks.validCarCategory,
            price: 37.6,
            carIds: [car.id]
        }
        const customer = Object.create(mocks.validCustomer)
        customer.age = 20

        const numberOfDays = 5
        const dueDate = '10 de novembro de 2020'

        const now = new Date(2020, 10, 5)
        sandbox.useFakeTimers(now.getTime())

        sandbox.stub(carService.carRepository, carService.carRepository.find.name)
            .resolves(car)

        const expectedAmount = carService.currencyFormat.format(206.8)
        const result = await carService.rent(customer, carCategory, numberOfDays)
        const expected = new Transaction({
            customer,
            car,
            dueDate,
            amount: expectedAmount
        })

        expect(result).to.be.deep.equal(expected)
    })
})