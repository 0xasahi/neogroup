import React from 'react';
import classnames from 'classnames';
import DOMPurify from 'isomorphic-dompurify';
import './style.scss';
import {getDisplayDate} from '../../common/utils';

function Author (props) {
    const {mastodon_username, mastodon_account, authored_at, showNote = false} = props;
    const {
        display_name,
        avatar,
        note,
        url,
    } = mastodon_account;

    return (
        <div className='author'>
            <div className={classnames('left-side', {'center': showNote})}>
                <a href={`/group/profile/${mastodon_username}/`} className='topic-author' >
                    <img alt={mastodon_username} className="avatar" src={avatar} />
                </a>
            </div>
            <div className='right-side'>
                <div className='topic-user' alt={mastodon_username}>
                    <div className="topic-user-username">
                        <span className="display-name"> {display_name} </span>
                        <a className='mastodon-account'href={`/group/profile/${mastodon_username}/`}>
                            {mastodon_username}
                        </a>

                    </div>
                    {showNote && note && <div
                        className='note'
                        dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(note)
                        }}
                    />}
                </div>
                <div className='authored-at' title={authored_at}>
                    {getDisplayDate(new Date(authored_at), new Date())}
                </div>
            </div>
        </div >
    )
        ;
}

export default Author;
