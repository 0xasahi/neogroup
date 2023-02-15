import './style.scss';
import '../../../common/sidebar.scss';
import React from 'react';
import GroupCard from '../../GroupCard';
import TopicCard from '../../TopicCard';


function TopicSidebar (props) {
    const {group, last_topics} = props;
    console.log(group, last_topics)
    return (
        <div className='sidebar'>
            <GroupCard {...group} />
            {last_topics &&
                (
                    <div className='sidebar-section'>
                        <span className='sidebar-section-title'>正在发生</span>
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

