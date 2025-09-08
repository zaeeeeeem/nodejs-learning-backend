import mongoose, {isValidObjectId, Mongoose} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on video
    const {videoId} = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.exists({_id: videoId})

    if(!video) {
        throw new ApiError(404, "Video not found")
    }

    const userId = new mongoose.Types.ObjectId(req.user._id)

    const like = await Like.findOne({ video: videoId, likedBy: userId }).populate("video", "title description")

    if (like) {
        await like.deleteOne()
        return res.status(200).json(new ApiResponse(true, "Video unliked successfully", like))
    }

    const likeDetails = await Like.create({ video: videoId, likedBy: userId })

    return res.status(200).json(new ApiResponse(true, "Video liked successfully", likeDetails))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on comment
    const {commentId} = req.params

    if(!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    const commentExists = await Comment.exists({_id: commentId})

    if(!commentExists) {
        throw new ApiError(404, "Comment not found")
    }

    const userId = req.user._id

    const like = await Like.findOne({ comment: commentId, likedBy: userId })

    if (like) {
        await like.deleteOne()
        return res.status(200).json(new ApiResponse(true, "Comment unliked successfully"))
    }

    await Like.create({ comment: commentId, likedBy: userId })

    return res.status(200).json(new ApiResponse(true, "Comment liked successfully"))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on tweet
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    const tweetExists = await Tweet.exists({_id: tweetId})

    if(!tweetExists) {
        throw new ApiError(404, "Tweet not found")
    }

    const userId = req.user._id

    const like = await Like.findOne({ tweet: tweetId, likedBy: userId })

    if (like) {
        await like.deleteOne()
        return res.status(200).json(new ApiResponse(true, "Tweet unliked successfully"))
    }

    await Like.create({ tweet: tweetId, likedBy: userId })

    return res.status(200).json(new ApiResponse(true, "Tweet liked successfully"))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    var userId = req.user._id
    userId = new mongoose.Types.ObjectId(userId)

    const likes = await Like.find({ likedBy: userId, video: { $ne: null } }).populate("video")

    const likedVideos = likes.map(like => like.video)

    const totalLikedVideos = likedVideos.length;

    if(totalLikedVideos === 0) {
        return res.status(200).json(new ApiResponse(true, "No liked videos found", []))
    }

    return res.status(200).json(new ApiResponse(true, "Liked videos fetched successfully", likedVideos))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}