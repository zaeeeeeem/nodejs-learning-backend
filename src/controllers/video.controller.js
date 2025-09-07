import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    //TODO: get all videos based on query, sort, pagination
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    const filter = { isPublished: true }

    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ]
    }

    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId")
        }
        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, "User not found")
        }

        filter.owner = new mongoose.Types.ObjectId(userId)
    }

    const sort = {}
    if (sortBy) {
        const sortField = sortBy
        const sortOrder = sortType === "desc" ? -1 : 1
        sort[sortField] = sortOrder
    } else {
        sort.createdAt = -1 // default sort by createdAt descending
    }
    const options = { page: parseInt(page, 10), limit: parseInt(limit, 10), sort, populate: { path: "owner", select: "name email" } }
    const aggregate = Video.aggregate().match(filter)
    const videos = await Video.aggregatePaginate(aggregate, options)

    return res.status(200).json(new ApiResponse(200, "Videos fetched successfully", videos))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if (!req.files || !req.files.videoFile || req.files.videoFile.length === 0) {
        throw new ApiError(400, "Video file is required")
    }

    if (!req.files || !req.files.thumbnail || req.files.thumbnail.length === 0) {
        throw new ApiError(400, "Thumbnail image is required")
    }

    const videoFile = req.files.videoFile[0]
    const thumbnailFile = req.files.thumbnail[0]

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required")
    }

    if (title.length < 3 || title.length > 100) {
        throw new ApiError(400, "Title must be between 3 and 100 characters")
    }

    if (description.length < 3 || description.length > 500) {
        throw new ApiError(400, "Description must be between 3 and 500 characters")
    }

    const videoUploadResponse = await uploadOnCloudinary(videoFile.path, "video")
    const thumbnailUploadResponse = await uploadOnCloudinary(thumbnailFile.path, "image")

    const newVideo = await Video.create({
        videoFile: videoUploadResponse.secure_url,
        thumbnail: thumbnailUploadResponse.secure_url,
        title,
        description,
        duration: videoUploadResponse.duration,
        owner: req.user._id
    })

    return res.status(201).json(new ApiResponse(201, "Video published successfully", newVideo))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId).populate("owner", "name email")
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // Increment view count
    video.views += 1
    await video.save()

    return res.status(200).json(new ApiResponse(200, "Video fetched successfully", video))
})

const updateVideo = asyncHandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video")
    }

    const { title, description } = req.body

    if (title) {
        if (title.length < 3 || title.length > 100) {
            throw new ApiError(400, "Title must be between 3 and 100 characters")
        }
        video.title = title
    }   

    if (description) {
        if (description.length < 3 || description.length > 500) {
            throw new ApiError(400, "Description must be between 3 and 500 characters")
        }   
        video.description = description
    }

    if (req.file) {
        // If thumbnail is being updated
        const thumbnailUploadResponse = await uploadOnCloudinary(req.file.path, "image")
        video.thumbnail = thumbnailUploadResponse.secure_url
    }

    await video.save()

    return res.status(200).json(new ApiResponse(200, "Video updated successfully", video))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video")
    }

    await video.deleteOne()

    return res.status(200).json(new ApiResponse(200, "Video deleted successfully", null))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video")
    }

    video.isPublished = !video.isPublished
    await video.save()

    return res.status(200).json(new ApiResponse(200, `Video ${video.isPublished ? "published" : "unpublished"} successfully`, video))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
