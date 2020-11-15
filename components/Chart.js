import React, { useState, useEffect } from "react";
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { query } from "../library/api";
import CircularProgress from '@material-ui/core/CircularProgress';

export default function Chart(props) {

  const [loading, setLoading] = useState(false)
  const [render, setRender] = useState(true)
  const [labels, setLabels] = useState([])
  const [datasets, setDatasets] = useState([])

  useEffect(() => {
    setLoading(true)
    query({
      ...(props.filters || {}),
      _token: props.token
    },
      res => {
        setLabels(props.labels(res.data))
        let newDatasets = []
        props.datasets.map(dataset => {
          let newDataset = {
            label: dataset.label || "Graphe",
            backgroundColor: props.type == "line" ? "" : dataset.backgroundColor || `rgba(${dataset.colorCode || "255,99,132"},1)`,
            borderColor: `rgba(${dataset.colorCode || "255,99,132"},1)`,
            borderWidth: 0,
            hoverBackgroundColor: props.type == "line" ? "" : dataset.hoverBackgroundColor || `rgba(${dataset.colorCode || "255,99,132"},0.4)`,
            hoverBorderColor: `rgba(${dataset.colorCode || "255,99,132"},1)`,
            // props.data function shouldn't be async
            data: props.data(dataset.id, res.data)
          }
          newDatasets.push(newDataset)
        })
        setDatasets(newDatasets)
        setLoading(false)
      },
      err => {
        console.log(err);
        setLoading(false)
      }
    )
  }, [])


  const removeFirstZeros = (arrays) => {
    let tla = arrays.labels, tda = arrays.data
    if (tda[0] == 0) {
      tda.shift()
      tla.shift()
      return removeFirstZeros({ labels: tla, data: tda })
    }
    return { labels: tla, data: tda }
  }

  const removeLastZeros = (arrays) => {
    let tla = arrays.labels, tda = arrays.data
    if (tda[tda.length - 1] == 0) {
      tda.pop()
      tla.pop()
      return removeLastZeros({ labels: tla, data: tda })
    }
    return { labels: tla, data: tda }
  }

  /*useEffect(() => {
    if (props.trimZeros && data.length > 0) {
      let arrays = removeFirstZeros(
        removeLastZeros({ labels: labels, data: data })
      )
      if (arrays.labels != labels) setLabels(arrays.labels)
      if (arrays.data != data) setData(arrays.data)
      setRender(false)
    } else {
      setRender(false)
    }
  }, [data])*/

  useEffect(() => {
    if (!render) {
      setRender(true)
    }
  }, [render])

  return <>
    {loading ? <div className="flex items-center justify-center w-full py-10">
      <CircularProgress size={50} />
    </div> : <>
        {render &&
          <div style={{ direction: "ltr" }}>
            {props.type == "bar" &&
              <Bar
                data={{
                  labels: labels,
                  datasets: datasets
                }}
                width={props.width || 600}
                height={props.height || 600}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    xAxes: [{
                      stacked: true
                    }],
                    yAxes: [{
                      beginAtZero: true,
                      stepSize: 1,
                      stacked: true
                    }]
                  },
                  ...(props.options || {})
                }}
              />
            }
            {props.type == "line" &&
              <Line
                data={{
                  labels: labels,
                  datasets: datasets
                }}
                width={props.width || 600}
                height={props.height || 600}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    xAxes: [{
                      stacked: true
                    }],
                    yAxes: [{
                      beginAtZero: true,
                      stepSize: 1,
                      stacked: true
                    }]
                  },
                  ...(props.options || {})
                }}
              />
            }
            {props.type == "doughnut" &&
              <Doughnut
                data={{
                  labels: labels,
                  datasets: datasets
                }}
                width={props.width || 600}
                height={props.height || 600}
                options={{
                  responsive: true,
                  legend: {
                    position: 'top',
                  },
                  animation: {
                    animateScale: true,
                    animateRotate: true
                  },
                  ...(props.options || {})
                }}
              />
            }
          </div>
        }
      </>
    }
  </>
}