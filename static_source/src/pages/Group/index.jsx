import React from 'react';
import {Group} from '../../components/Card'
import './style.scss';

function GroupHome (props) {
    console.log(props);

    return (
        <div className='group'>
            <Group {...props.group} />
            <span className='group-description'>
                {/* ({user.mastodon_account.username} · {updated_at}) */}
            </span>
        </div>
    );
}

export default GroupHome;
