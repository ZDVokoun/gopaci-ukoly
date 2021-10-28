import { Box } from "@mui/material";
import { format } from "date-fns";
import { cs } from "date-fns/locale"

export function Agenda ({homeworks, sx, history}) {
    const groupByDate = homeworks => {
        let groups = [];
        for (let homework of homeworks) {
            let date = (new Date(homework.dueTime)).toDateString();
            let known = groups.findIndex(group => group.date === date)
            if (known === -1) {
                groups.push({date, homeworks: [homework]})
            } else {
                groups[known].homeworks.push(homework);
            }
        }
        return groups
    }
    const filtered = groupByDate(homeworks).sort((first,second) => new Date(first.date) - new Date(second.date));
    return (<Box sx={sx}>
        {filtered && filtered.map(group => <div><p>{format(new Date(group.date), "EEEE d. MMMM y", {locale: cs})}</p>{group.homeworks.map(homework => <div className={"agendaItem" + (homework.voluntary ? " voluntary" : "")} onClick={() => history.push("homework/" + homework.id)}>{homework.name}</div>)}</div>)}
    </Box>)
}