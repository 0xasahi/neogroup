import React from 'react';
import './style.scss';

function UserCard (props) {
    const {mastodon_site, mastodon_account} = props;
    const {
        acct,
        display_name,
        avatar,
        header,
        note,
        url,
        followers_count,
        following_count,
        statuses_count,
    } = mastodon_account;

    return (
        <a href={url} className='user' target='_blank' rel='noopener noreferrer'>
            <img className='user-avatar' src={avatar} alt={acct} />
            <div className='user-info'>
                <div className='user-name'>
                    {display_name}
                </div>
                <div className='user-account'>
                    <strong className='user-id'>{acct}</strong>
                    <span className='user-mastodon_site'>@{mastodon_site}</span>
                </div>
            </div>
        </a>
    );
}

export default UserCard;
