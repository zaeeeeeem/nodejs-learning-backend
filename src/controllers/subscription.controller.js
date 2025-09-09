import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    // TODO: toggle subscription
    const {channelId} = req.params

    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId")
    }

    if(channelId === req.user.id) {
        throw new ApiError(400, "You cannot subscribe to yourself")
    }

    const channel = await User.findById(channelId)
    if(!channel) {
        throw new ApiError(404, "Channel not found")
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: req.user.id,
        channel: channelId
    })

    if(existingSubscription) {
        // unsubscribe
        await existingSubscription.deleteOne()
        return res.status(200).json(new ApiResponse(200, "Unsubscribed successfully"))
    } else {
        // subscribe
        await Subscription.create({
            subscriber: req.user.id,
            channel: channelId
        })
        return res.status(200).json(new ApiResponse(200, "Subscribed successfully"))
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {subscriberId} = req.params

    if(!isValidObjectId(subscriberId)) {
        console.log("Invalid subscriberId:", subscriberId)
        throw new ApiError(400, "Invalid subscriberId")
    }

    const channel = await User.findById(subscriberId)
    if(!channel) {
        throw new ApiError(404, "Channel not found")
    }

    const subscribers = await Subscription
        .find({channel: subscriberId})
        .populate('subscriber', 'username email')

    const subscriberList = subscribers.map(sub => sub.subscriber)

    return res.status(200).json(new ApiResponse(200, "Subscribers fetched successfully", subscriberList))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId")
    }

    const subscriber = await User.findById(channelId)
    if (!subscriber) {
        throw new ApiError(404, "Subscriber not found")
    }

    const subscriptions = await Subscription.find({ subscriber: channelId }).populate('channel', 'username email')

    const channels = subscriptions.map(sub => sub.channel)

    return res.status(200).json(new ApiResponse(200, "Subscribed channels fetched successfully", channels))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}