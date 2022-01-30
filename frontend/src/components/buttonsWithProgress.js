import { CircularProgress, IconButton } from "@mui/material"
import { Replay } from "@mui/icons-material"

export function ReloadButton({ isLoading, onClick }) {
  return (
    <IconButton onClick={onClick}>
      { isLoading ? <CircularProgress size="24px"/> : <Replay/> }
    </IconButton>
  )
}
