import Paper from '@material-ui/core/Paper'
import TimelineIcon from '@material-ui/icons/Timeline'
import { __ } from "classia"

export default function CountBox(props) {

  const Icon = props.icon || TimelineIcon

  return <Paper className="flex w-full">
    <div className={`w-full p-5 relative ${props.className}`} onClick={props.onClick}>
      {__(props.title)}
      <div className="font-bold text-3xl mt-2" {...props.valueProps}>{props.value}</div>
      {props.details && <div className="mt-2">{props.details}</div>}
      <div className="flex w-full absolute top-0 left-0 justify-end p-5">
        <Icon className="text-gray-400" style={{ fontSize: 50 }} />
      </div>
    </div>
  </Paper>
}