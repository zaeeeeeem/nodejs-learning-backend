import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    var {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    videoId = new mongoose.Types.ObjectId(videoId);

    if(!videoId) {
        throw new ApiError(400, "Video Id is Required");
    }

    if(!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid Video Id");
    }
    
    const comments = await Comment.find({video: videoId}).sort({createdAt: -1})
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate("owner", "name email avatar");

    const total = await Comment.countDocuments({video: videoId});

    return res.status(200).json(new ApiResponse(true, "Comments fetched successfully", {
        comments,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
    }))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {text} = req.body
    const userId = req.user._id

    if(!videoId) {
        throw new ApiError(400, "Video Id is Required");
    }
    if(!text) {
        throw new ApiError(400, "Comment text is Required");
    }
    if(!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid Video Id");
    }
    const comment = new Comment({
        content: text,
        video: videoId,
        owner: userId
    })
    await comment.save()
    return res.status(201).json(new ApiResponse(true, "Comment added successfully", comment))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {text} = req.body
    const userId = req.user._id

    if(!commentId) {
        throw new ApiError(400, "Comment Id is Required");
    }
    if(!text) {
        throw new ApiError(400, "Comment text is Required");
    }
    if(!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid Comment Id");
    }

    const comment = await Comment.findById(commentId)

    if(!comment) {
        throw new ApiError(404, "Comment not found");
    }
    if(comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to update this comment");
    }

    comment.content = text
    await comment.save()

    return res.status(200).json(new ApiResponse(true, "Comment updated successfully", comment))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    const userId = req.user._id

    if(!commentId) {
        throw new ApiError(400, "Comment Id is Required");
    }
    if(!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid Comment Id");
    }

    const comment = await Comment.findById(commentId)
    
    if(!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if(comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment");
    }

    await comment.deleteOne()

    return res.status(200).json(new ApiResponse(true, "Comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
}
