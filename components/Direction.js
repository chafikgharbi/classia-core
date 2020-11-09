import { create } from 'jss';
import rtl from 'jss-rtl';
import { StylesProvider, jssPreset } from '@material-ui/core/styles';

// Configure JSS
const jss = create({ plugins: [...jssPreset().plugins, rtl()] });

export default (props) => {
    return props.dir == "rtl" ?
        <StylesProvider jss={jss}>
            {props.children}
        </StylesProvider>
        : props.children
}