import './style.scss';
import React from 'react';
import {ReplyIcon} from '../Comment'

function Quote (props) {
    const {comment, onRemove} = props;
    return (
        <div className='comment-quote'>
            <div className='comment-quote-content'>
                {comment.content}
            </div>
            <div className='comment-quote-author'>
                {comment.user && comment.user.username}
            </div>
        </div>
    );
}

export default Quote;

