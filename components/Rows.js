import React, { Component } from "react"
import { query } from "../library/api"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faEye } from '@fortawesome/free-solid-svg-icons'
import Header from "./Head"
import DataTable from "react-data-table-component"
import { __ } from "../library/translation"
import Entries from "./Entries"
import CircularProgress from '@material-ui/core/CircularProgress'
import IconButton from '@material-ui/core/IconButton'
import Paper from '@material-ui/core/Paper'
import PersonChip from "./PersonChip"

export default class Rows extends Component {

  // todo: infinite scroll for grid view

  constructor(props) {
    super(props)
    this.state = {
      loadingData: false,
      columns: [],
      rows: [],
      pagination: {},
      rowsPerPage: this.props.rowsPerPage || 30,
      currentPage: 1,
      filters: [],

      editModal: false,
      edit_row_id: null,
    };
  }

  componentDidMount = () => {

    if (this.props.onlyFields && this.props.returnFields) {

      this.props.returnFields(this.props.entry.fields)

    } else {

      if (this.props.view !== "grid" && this.props.view !== "custom") {
        let columns = []
        this.props.columns.map(column => {
          let newColumn = column
          newColumn.name = __(newColumn.name)

          newColumn.minWidth =
            newColumn.size == "xs" ? "50px"
              : newColumn.size == "sm" ? "100px"
                : newColumn.size == "md" ? "150px"
                  : newColumn.size == "lg" ? "200px"
                    : newColumn.size == "xl" ? "300px" : "150px"

          if (column.type == "person") {
            column.cell = row => <PersonChip row={row} selector={column.selector} />
          }

          columns.push(newColumn)
        })
        if (this.props.actions) {
          let actions = this.props.actions == true ? [] : this.props.actions
          if (actions.includes("show") || actions.includes("edit") || actions.includes("delete")) {
            columns.push({
              name: __("Action"),
              button: true,
              cell: row => (
                <div className="flex items-center">
                  {actions.includes("show") &&
                    <IconButton aria-label="Ajouter" onClick={(e) => {
                      //this.props.onShow(row)
                      e.stopPropagation();
                    }} >
                      <FontAwesomeIcon
                        className="cursor-pointer text-primary text-base"
                        style={{ width: "15px" }}
                        icon={faEye}
                      />
                    </IconButton>
                  }
                  {actions.includes("edit") && (!this.props.editOn || this.props.editOn(row) == true) &&
                    <IconButton aria-label="Ajouter" onClick={(e) => {
                      this.setState({ editModal: true, edit_row_id: row.id })
                      e.stopPropagation();
                    }} >
                      <FontAwesomeIcon
                        className="cursor-pointer text-primary text-base"
                        style={{ width: "15px" }}
                        icon={faEdit}
                      />
                    </IconButton>
                  }
                  {actions.includes("delete") &&
                    <IconButton aria-label="Ajouter" onClick={(e) => {
                      //this.props.onDelete(row)
                      e.stopPropagation();
                    }} >
                      <FontAwesomeIcon
                        className="cursor-pointer text-primary text-base"
                        style={{ width: "15px" }}
                        icon={faTrash}
                      />
                    </IconButton>
                  }
                </div>
              )
            })
          }
        }
        this.setState({ columns })
      }
      this.getRows(0)
    }
  }

  getRows = (start) => {
    this.setState({ loadingData: true })
    const filters = {
      model: ["=", this.props.model],
      ...this.state.filters,
      ...this.props.filters,
      ...((this.props.override || {}).filters || {})
    }

    if (this.props.onFiltered) this.props.onFiltered(filters)

    query({
      ...filters,
      _start: start,
      _limit: this.state.rowsPerPage,
      _token: this.props.token
    },
      res => {
        let rows = res.data.rows.map((row, index) => {
          return { _index: index, ...row }
        })
        this.setState({
          rows: rows,
          pagination: res.data.pagination,
          loadingData: false,
        })
      },
      err => {
        console.log(err);
        this.setState({ loadingData: false })
      }
    )
  }

  refresh = () => {
    console.log("refresh")
    this.getRows(this.state.rowsPerPage * (this.state.currentPage - 1))
  }

  export = () => {

    function escape(string) {
      if (string) {
        if (string.includes('"')) {
          return '"' + string + '"';
        }
        if (string.includes(",")) {
          return '"' + string + '"';
        }
        return string
      }
      else return ""
    }

    var results = [[]];

    this.props.columns.map(col => {
      if (col.type == "person") {
        results[0].push("Nom")
        results[0].push("Prénom")
        results[0].push("Matricule")
      }
      else if (col.selector || col.cell) results[0].push(col.name)
    })

    this.state.rows.map(row => {
      let line = []
      this.props.columns.map(col => {
        if (col.type == "person") {
          let person = row[col.selector + "_data"] || row
          line.push(escape(person.last_name))
          line.push(escape(person.first_name))
          line.push(escape(person.model == "person" ? person.ref : ""))
        }
        else if (col.cell) line.push(escape(col.cell(row)))
        else if (col.selector) line.push(escape(row[col.selector]))
      })
      results.push(line)
    })

    var CsvString = "";
    results.forEach((RowItem, RowIndex) => {
      RowItem.forEach((ColItem, ColIndex) => {
        CsvString += ColItem + ',';
      });
      CsvString += "\r\n";
    });
    CsvString = "data:application/csv," + encodeURIComponent(CsvString);
    var x = document.createElement("A");
    x.setAttribute("href", CsvString);
    x.setAttribute("download", "somedata.csv");
    document.body.appendChild(x);
    x.click();
  }

  render() {

    if (this.props.onlyFields && this.props.returnFields) return <></>

    const table = <>
      {!this.props.noHeader &&
        <Header {...this.props}
          title={this.props.title}
          filterFields={this.props.filterFields}
          setFilters={(filters) => {
            this.setState({ filters }, () => {
              this.refresh()
            })
          }}
          onAdd={() => {
            this.setState({ editModal: true, edit_row_id: null })
          }}
          onExport={() => {
            //alert("Exporting")

            this.export()

          }}
        />
      }
      <DataTable
        title={this.props.title}
        columns={this.state.columns}
        noHeader
        selectableRows={this.props.selectableRows}
        data={this.state.rows}
        pointerOnHover={this.props.pointerOnHover}
        pagination
        paginationServer
        paginationTotalRows={this.state.pagination.count}
        paginationPerPage={this.state.rowsPerPage}
        onSelectedRowsChange={this.handleSelection}
        onRowClicked={this.props.onRowClicked ? this.props.onRowClicked : () => { }}
        onChangePage={(page, totalRows) => {
          this.getRows(this.state.rowsPerPage * (page - 1))
        }}
        onChangeRowsPerPage={(currentRowsPerPage, currentPage) => {
          this.setState({ rowsPerPage: currentRowsPerPage, currentPage }, () => {
            this.getRows(currentRowsPerPage * (currentPage - 1))
          })
        }}
        paginationComponentOptions={
          {
            rowsPerPageText: 'Lignes par page:',
            rangeSeparatorText: 'sur',
            noRowsPerPage: false,
            selectAllRowsItem: false,
            selectAllRowsItemText: 'Tous'
          }
        }
        noDataComponent={<div className="p-5">
          {this.state.loadingData ? <div className="pb-2">
            <CircularProgress size={50} />
          </div> :
            this.state.rows.length < 1 ? __("Aucune donnée trouvée") : ""}
        </div>}
        {...(this.props.editOnRowClicked ? {
          onRowClicked: (row) => {
            this.setState({ editModal: true, edit_row_id: row.id })
          }
        } : {})}
      />
    </>

    const entries = <Entries
      {...this.props}
      model={this.props.model}
      entry={this.props.entry}
      override={this.props.override}
      id={this.state.edit_row_id}
      onClose={() => {
        this.setState({ editModal: false, edit_row_id: null })
      }}
      created={(id) => {
        this.refresh()
        this.setState({ editModal: false, edit_row_id: null })
        if (this.props.refresh) this.props.refresh()
      }}
      updated={(id) => {
        this.refresh()
        this.setState({ editModal: false, edit_row_id: null })
        if (this.props.refresh) this.props.refresh()
      }}
      deleted={(id) => {
        this.refresh()
        this.setState({ editModal: false, edit_row_id: null })
        if (this.props.refresh) this.props.refresh()
      }}
      createdId={(id) => {
        this.refresh()
        this.setState({ edit_row_id: id })
        if (this.props.refresh) this.props.refresh()
      }}
      {...(this.props.entriesProps || {})}
    />

    return (
      <>
        {this.props.onlyEntries ? entries : this.state.editModal && entries}
        {!this.props.onlyEntries && <>
          {this.props.before &&
            <div>
              {this.props.before(this.state.rows, this.state.filters)}
            </div>
          }
          {this.props.view == "grid" ?
            <>
              {!this.props.noHeader &&
                <Paper>
                  <Header {...this.props}
                    title={this.props.title}
                    filterFields={this.props.filterFields}
                    setFilters={(filters) => {
                      this.setState({ filters }, () => {
                        this.refresh()
                      })
                    }}
                    onAdd={() => {
                      this.setState({ editModal: true, edit_row_id: null })
                    }}
                  />
                </Paper>
              }
              {this.state.loadingData ?
                <div className="flex items-center justify-center pb-10 mt-10">
                  <CircularProgress size={50} />
                </div> :
                this.state.rows.length > 0 ? <div className="flex flex-wrap -m-3 mt-3">
                  {this.state.rows.map((row, index) =>
                    <div key={index}
                      className={`p-3 ${((this.props.gridProps || {}).itemContainer || {}).className}`}>
                      <div className="cursor-pointer border border-transparent hover:border-gray-700"
                        onClick={this.props.editOnRowClicked ?
                          () => this.setState({ editModal: true, edit_row_id: row.id }) :
                          this.props.onRowClicked ? () => this.props.onRowClicked(row) : () => { }
                        }
                      >
                        {this.props.renderItem(row)}
                      </div>
                    </div>
                  )}
                </div> : <div className="py-10 text-center">{__("Aucune donnée trouvée")}</div>
              }
            </> :
            this.props.view == "custom" ? <>
              {!this.props.noHeader &&
                <Paper>
                  <Header {...this.props}
                    title={this.props.title}
                    filterFields={this.props.filterFields}
                    setFilters={(filters) => {
                      this.setState({ filters }, () => {
                        this.refresh()
                      })
                    }}
                    onAdd={() => {
                      this.setState({ editModal: true, edit_row_id: null })
                    }}
                  />
                </Paper>
              }
              {this.props.renderContent(this.state.rows, this)}
            </> :
              <>
                {this.props.noFrame ? table :
                  <Paper className="overflow-hidden">
                    {table}
                  </Paper>
                }
              </>
          }
          {this.props.highlightOnHover && <style global jsx>{`
            .rdt_TableRow:hover,
            .rdt_TableRow:nth-child(even):hover {
              background: rgb(189, 195, 199, 0.3)
            }
          `}</style>
          }

          {<style global jsx>{`
            .rdt_TableRow:not(:last-of-type) {
                border: 0 !important;
            }
            .rdt_TableRow:nth-child(even) {
                background: rgb(189, 195, 199, 0.1);
            }
          `}</style>}
        </>}
      </>
    )
  }
}