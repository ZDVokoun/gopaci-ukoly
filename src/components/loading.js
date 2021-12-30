import { Backdrop, CircularProgress } from "@mui/material"

export function Loading() {
    return <CircularProgress size="3rem" style={{margin: "auto auto auto auto"}}/>
}
export function LoadingWithBackdrop() {
    return <Backdrop open={true} sx={{zIndex: 1500}}><CircularProgress size="3rem" style={{margin: "auto"}}/></Backdrop>
}
