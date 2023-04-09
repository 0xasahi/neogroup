import './style.scss';
import React, {useState} from 'react';
import axiosInstance from '../../common/axios';

const LikeIcon = (props) =>
    <svg {...props} width="24px" height="24px" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" className="icon">
        <path d="M885.9 533.7c16.8-22.2 26.1-49.4 26.1-77.7 0-44.9-25.1-87.4-65.5-111.1a67.67 67.67 0 0 0-34.3-9.3H572.4l6-122.9c1.4-29.7-9.1-57.9-29.5-79.4A106.62 106.62 0 0 0 471 99.9c-52 0-98 35-111.8 85.1l-85.9 311h-.3v428h472.3c9.2 0 18.2-1.8 26.5-5.4 47.6-20.3 78.3-66.8 78.3-118.4 0-12.6-1.8-25-5.4-37 16.8-22.2 26.1-49.4 26.1-77.7 0-12.6-1.8-25-5.4-37 16.8-22.2 26.1-49.4 26.1-77.7-.2-12.6-2-25.1-5.6-37.1zM112 528v364c0 17.7 14.3 32 32 32h65V496h-65c-17.7 0-32 14.3-32 32z" />
    </svg>

function Like (props) {
    const {targetId, liked, likeCount, onClick} = props;
    const [likedState, setLikedState] = useState({
        liked: liked,
        likeCount: likeCount
    });

    const postLike = async () => {
        await axiosInstance.post(`/group/comment/${targetId}/like`, {},
        ).then((res) => {
            if (res.status == 200 && res.data && res.data.r === 0) {
                let nowLiked = Boolean(res.data.data);
                setLikedState(s => ({
                    liked: nowLiked,
                    likeCount: s.likeCount + (nowLiked ? 1 : -1)
                }));
            }
            else {
                alert(res.data.msg);
            }
        }).catch((err) => {
            if (err.response && err.response.status === 403) {
                alert("请先登录");
            }
        })
    }

    const onClickLike = () => {
        postLike();
        onClick && onClick();
    }

    return (
        <div className={
            'like' + (likedState.liked ? ' liked' : '')
        }>
            <LikeIcon onClick={onClickLike} />
            <span className='like-count' >{likedState.likeCount}</span>
        </div>
    );
}

export default Like;
