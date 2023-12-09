import User from "../models/userModel.js";
import bcrypt from 'bcryptjs';
import generateTokenandSetCookie from "../utils/helpers/generateTokenandSetCookie.js";

const getUserProfile = async(req, res) => {
    const {username} = req.params;
    try {
        const user = await User.findOne({username}).select("-password").select("-updatedAt");
        if(!user) return res.status(400).json({message: "user not found"});
        
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({message: err.message})
        console.log("Error in getting profile: ", err.message)
    }
}
const signupUser = async(req, res) => {
    try{
        const {name, email, username, password} = req.body;
        const user = await User.findOne({$or: [{email}, {username}]});
        
        if(user){
            return res.status(400).json({message: "User already exists!"});
        }

        if(!(email.match(/(@gmail.com)$/)))
        {
            return res.status(400).json({message: "Invalid email"});
        }

        if(!(password.match(/(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/)))
        {
            return res.status(400).json({message: "Invalid password"});
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name, email, username, password: hashedPassword
        });
        await newUser.save();

        if(newUser){
            generateTokenandSetCookie(newUser._id, res);
            res.status(201).json({
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                username: newUser.username
            })
        }else{
            res.status(400).json({message: "Invalid User Data"});
        }
    }catch(err){
        res.status(500).json({message: err.message})
        console.log("Error: ", err.message)
    }
}

const loginUser = async(req, res) => {
    try {
        const {username, password} = req.body;
        const user = await User.findOne({username});
        const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

        if(!user || !isPasswordCorrect) return res.status(400).json({message: "Invalid username or password"});
        generateTokenandSetCookie(user._id, res);
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
        });
    } catch (error) {
        res.status(500).json({message: error.message});
        console.log("Error while logging in", error);
    }
}

const logoutUser = (req, res) => {
    try {
        res.cookie("jwt", "", {maxAge: 1});
        res.status(200).json({message: "User logged out successfully"});
    } catch (err) {
        res.status(500).json({message: err.message})
        console.log("Error while logging out ", err.message)
    }
}

const followUnfollowUser = async(req, res) => {
    try {
        const {id} = req.params;
        const userToModify = await User.findById(id);
        const currentUser = await User.findById(req.user._id);

        if(id === req.user._id.toString()) return res.status(400).json({message: "You cannot follow/unfollow yourself"});

        if(!userToModify || !currentUser) return res.status(400).json({message: "User not found"});

        const isFollowing = currentUser.following.includes(id);

        if(isFollowing){
            await User.findByIdAndUpdate(req.user._id, {$pull: {following: id}});
            await User.findByIdAndUpdate(id, {$pull: {followers: req.user._id}});
            res.status(200).json({message: "User unfollowed successfully"});
        }else{
            await User.findByIdAndUpdate(req.user._id, {$push: {following: id}});
            await User.findByIdAndUpdate(id, {$push: {followers: req.user._id}});
            res.status(200).json({message: "User followed successfully"});
        }
    } catch (err) {
        res.status(500).json({message: err.message})
        console.log("Error in follow/unfollow: ", err.message)
    }
}

const updateUser = async(req, res) => {
    const {name, email, username, password, profilePic, bio} = req.body;
    const userId = req.user._id;
    try {    
        let user = await User.findById(userId);
        if(!user) return res.status(400).json({message: "User not found"});

        if(req.params.id !== userId.toString()) return res.status(400).json({message: "You cannot update other user's profile"});
        if(password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            user.password = hashedPassword;
        }
        user.name = name || user.name;
        user.email = email || user.email;
        user.username = username || user.username;
        user.profilePic = profilePic || user.profilePic;
        user.bio = bio || user.bio;

        user = await user.save();
        res.status(200).json({message: "Profile updated successfully", user});
    } catch (err) {
        res.status(500).json({message: err.message})
        console.log("Error in update: ", err.message)
    }
}

export {signupUser, loginUser, logoutUser, followUnfollowUser, updateUser, getUserProfile};