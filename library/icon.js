export default (props) => {
  return <img src={`/images/icons/${props.name}.svg`}
    className={props.className}
    style={props.style}
  />
}