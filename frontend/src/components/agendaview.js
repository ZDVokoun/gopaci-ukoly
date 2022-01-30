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
        {filtered && filtered.map(group => 
            <div>
                <p>{format(new Date(group.date), "EEEE d. MMMM y", {locale: cs})}</p>
                {group.homeworks.map(homework => 
                    <div className={"agendaItem"} style={{backgroundColor: homework.done ? "rgb(27, 125, 52)" : (homework.voluntary ? "rgb(66, 37, 204)" : {homework: "#1976d2", test: "rgb(34, 60, 200)", other: "#19a7d2"}[homework.type])}} onClick={() => history.push("homework/" + homework.id)}>
                        {homework.name}
                    </div>
                )}
            </div>)}
    </Box>)
}