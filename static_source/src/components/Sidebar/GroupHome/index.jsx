import './style.scss';
import '../../../common/sidebar.scss';
import React from 'react';
import GroupCard from '../../Card/Group';
import TopicCard from '../../TopicCard';

function GroupSidebar (props) {
    const {group, last_topics} = props;
    return (
        <div className='sidebar'>
            <GroupCard {...group} />
            {last_topics &&
                (
                    <div className='sidebar-section'>
                        <span className='sidebar-section-title'>最近加入</span>
                        <div className='sidebar-topics'>
                            {
                                last_topics.map((topic) => <TopicCard {...topic} />)
                            }
                        </div></div>)
            }
        </div >
    );
}


export default TopicSidebar;
