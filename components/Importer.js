import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

export default function Importer(props) {

  const start = () => { }

  return <>
    <Dialog open={true} onClose={props.onClose} maxWidth="md" aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">
        <div className="flex items-center justify-between -mt-2">
          <div>Importer</div>
          <div className="-mx-4">
            <IconButton aria-label="Ajouter" onClick={props.onClose} >
              <CloseIcon />
            </IconButton>
          </div>
        </div>
      </DialogTitle>
      <DialogContent>
        <div className="flex items-center flex-wrap -m-2">
          {props.entry.fields.filter(
            f => !["file", "image", "video", "rows"].includes(f.type)
          ).map((field, index) =>
            <div key={index} className="p-2 w-full sm:w-1/2">
              <div className="flex items-center p-1 border border-gray-400 rounded">
                <div className="w-1/2 p-2">{field.name} {field.type == "model" && "(matricule)"}</div>
                <div className="w-1/2 p-2">
                  <TextField
                    className="w-full"
                    label="Numéro de colonne"
                    variant="outlined"
                    value=""
                    onChange={e => console.log(e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose} color="primary">
          Annuler
      </Button>
        <Button onClick={start} color="primary">
          Importer
      </Button>
      </DialogActions>
    </Dialog>
  </>
}