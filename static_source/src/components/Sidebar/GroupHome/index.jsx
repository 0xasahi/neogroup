import './style.scss';
import '../../../common/sidebar.scss';
import React from 'react';
import SimpleGroupCard from '../../Card/SimpleGroup';

function GroupSidebar (props) {
    const {group} = props;
    return (
        <div className='sidebar'>
            <SimpleGroupCard {...group} />
        </div >
    );
}


export default GroupSidebar;
