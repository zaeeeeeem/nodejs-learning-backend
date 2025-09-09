import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const userId = new mongoose.Types.ObjectId(req.user.id);
    const totalVideos = await Video.countDocuments({owner: userId});
    const totalSubscribers = await Subscription.countDocuments({channel: userId});
    const totalViewsAggregate = await Video.aggregate([
        { $match: { owner: userId } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);
    const totalViews = totalViewsAggregate.length > 0 ? totalViewsAggregate[0].totalViews : 0;
    const totalLikesAggregate = await Like.aggregate([
        { $match: { likedBy: userId } },
        { $group: { _id: null, totalLikes: { $sum: 1 } } }
    ]);
    const totalLikedVideos = totalLikesAggregate.length > 0 ? totalLikesAggregate[0].totalLikes : 0;

    return res.status(200).json(new ApiResponse(true, "Channel stats fetched successfully", {
        totalVideos,
        totalSubscribers,
        totalViews,
        totalLikedVideos
    }));
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const userId = new mongoose.Types.ObjectId(req.user.id);
    const videos = await Video.find({owner: userId}).sort({createdAt: -1});

    return res.status(200).json(new ApiResponse(true, "Channel videos fetched successfully", {videos}));
})

export {
    getChannelStats, 
    getChannelVideos
}