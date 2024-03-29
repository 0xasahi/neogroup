import {isBrowser} from './common/utils';
import withHypernova from "./common/withHypernova";
import Nav from './components/Nav';
import {TopicSidebar, GroupSidebar} from "./components/Sidebar";
import {Topic, Group} from './pages';

const clientExport = {
    Nav: withHypernova('Nav')(Nav),
    Topic: withHypernova('Topic')(Topic),
    TopicSidebar,
    Group: withHypernova('Group')(Group),
    GroupSidebar
}

const serverExport = {
    Nav,
    Topic,
    TopicSidebar,
    Group,
    GroupSidebar
}

export default isBrowser() ? clientExport : serverExport;
