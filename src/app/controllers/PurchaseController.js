const Ad = require('../models/Ad')
const User = require('../models/User')
const Purchase = require('../models/Purchase')
const PurchaseMail = require('../jobs/PurchaseMail')
const Queue = require('../services/Queue')

class PurchaseController {
  async store (req, res) {
    const { ad, content } = req.body

    const purchaseAd = await Ad.findById(ad).populate('author')
    const user = await User.findById(req.userId)

    const purchase = await Purchase.create({ content, ad, user: user._id })

    Queue.create(PurchaseMail.key, {
      ad: purchaseAd,
      user,
      content
    }).save()

    return res.json(purchase)
  }

  async accept (req, res) {
    const { id } = req.params

    const { ad } = await Purchase.findById(id).populate({
      path: 'ad',
      populate: {
        path: 'author'
      }
    })

    if (req.userId !== ad.author._id.toString()) {
      return res.status(401).json({ error: 'You are not the ad author' })
    }

    if (ad.purchasedBy) {
      return res
        .status(401)
        .json({ error: 'This ad had already been puchased' })
    }

    ad.purchasedBy = id
    await ad.save()

    return res.json(ad)
  }
}

module.exports = new PurchaseController()
