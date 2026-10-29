import { Button, Section, Text } from "@react-email/components";
import { colors } from "@/lib/brand/tokens";
import { BaseEmail, styles } from "./Base";

export interface ReminderProps {
  appUrl: string;
  groupUrl: string;
  name: string;
  groupName: string;
  when: string;
  place: string;
  budget: string;
}

/** recordatorio antes del intercambio */
export function Reminder({ appUrl, groupUrl, name, groupName, when, place, budget }: ReminderProps) {
  return (
    <BaseEmail preview={`${name}, se acerca el intercambio de ${groupName}`} appUrl={appUrl}>
      <Text style={styles.h1}>{name}, se acerca el día</Text>
      <Text style={styles.text}>
        Ya casi es el intercambio de <strong>{groupName}</strong>. Si todavía no compraste el regalo,
        este es el empujón amable.
      </Text>
      <Section style={{ margin: "28px 0 36px" }}>
        <Button href={groupUrl} style={styles.button}>
          Ver a quién te tocó
        </Button>
      </Section>
      <Section style={{ borderTop: `1px solid ${colors.line}`, paddingTop: "16px" }}>
        <Text style={styles.label}>{groupName}</Text>
        <Text style={styles.soft}>Cuándo: {when}</Text>
        {place ? <Text style={styles.soft}>Dónde: {place}</Text> : null}
        <Text style={styles.soft}>Presupuesto: {budget}</Text>
      </Section>
    </BaseEmail>
  );
}

export default Reminder;
