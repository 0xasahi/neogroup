import React, {useEffect, useState, useRef} from 'react';
import DOMPurify from 'isomorphic-dompurify';
import Author from '../../components/Author';
import Comment from '../../components/Comment';
import ReplyForm from '../../components/ReplyForm';
import Pagination from '../../components/Pagination';
import axiosInstance from '../../common/axios';
import {useIsomorphicLayoutEffect} from '../../common/utils';
import './style.scss';

function Topic (props) {
    const [comments, setComments] = useState(props.comments || []);
    const [replyComment, setReplyComment] = useState(null);
    const [page, setPage] = useState(props.page);
    const {user, updated_at, id, title, html_content, group} = props;

    const replyFormRef = useRef(null);

    const fetchComments = async () => {
        await axiosInstance.get(`/group/topic/${id}/comments`, {
            params: {
                page: page,
            }
        }).then((res) => {
            if (res.status == 200) {
                if (res.data.r === 0) {
                    setComments(res.data.data);
                    window.scroll(0, document.querySelector('.comments-wrapper').offsetTop - 100, {
                        behavior: 'smooth'
                    });
                }
                else {
                    alert(res.data.msg);
                }
            }
        })
    }

    const firstUpdate = useRef(true);
    useIsomorphicLayoutEffect(() => {
        if (firstUpdate.current) {
            firstUpdate.current = false;
        } else {
            fetchComments();
            window.history.pushState(null, null, `?page=${page}`);
        }
    }, [page]);

    useEffect(() => {
        if (replyComment && replyFormRef.current) {
            const replyForm = replyFormRef.current?.querySelector('[contenteditable]');
            replyForm && replyForm.focus()
        }
    }, [replyComment]);

    useIsomorphicLayoutEffect(() => {
        // get comment id from url query ,active and scroll to it
        const urlParams = new URLSearchParams(window.location.search);
        const commentId = urlParams.get('comment_id');

        if (commentId) {
            const comment = document.getElementById(`comment-${commentId}`);
            if (comment) {
                window.scroll(0, comment.offsetTop - 100, {
                    behavior: 'smooth'
                });
                comment.classList.add('highlight');
                setTimeout(() => {
                    comment.classList.remove('highlight');
                }, 600);
            }
        }
    }, []);

    const onReply = (comment) => setReplyComment(comment);

    return (
        <div className='topic'>
            <div className='title'>
                {title}
            </div>
            <Author {...user} showNote={true} authored_at={updated_at} />
            <div
                className='topic-content'
                dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(html_content)
                }}
            />

            <div className='divide'/>
            <div className='comments-wrapper'>
                <div className='comments'>
                    {comments.map((comment, index) =>
                        <Comment key={index} {...comment} onReply={onReply} />)}
                </div>
                <Pagination
                    current={page}
                    total={props.total}
                    pageSize={props.page_size}
                    onChange={(page) => setPage(page)}
                />
            </div>
            <div className='reply-form-wrapper'>
                <ReplyForm ref={replyFormRef} replyComment={replyComment} topicId={id} />
            </div>
        </div>
    );
}


export default Topic;

