import { Button, Section, Text } from "@react-email/components";
import { colors } from "@/lib/brand/tokens";
import { BaseEmail, styles } from "./Base";

export interface TeTocoProps {
  appUrl: string;
  groupUrl: string;
  giverName: string;
  receiverName: string;
  groupName: string;
  when: string;
  place: string;
  budget: string;
}

/** el correo que le llega a cada participante con cuenta apenas se hace el sorteo */
export function TeToco({ appUrl, groupUrl, giverName, receiverName, groupName, when, place, budget }: TeTocoProps) {
  return (
    <BaseEmail preview={`${giverName}, ya sabemos quién te tocó. Shh.`} appUrl={appUrl}>
      <Text style={styles.h1}>
        {giverName}, te tocó {receiverName}
      </Text>
      <Text style={styles.text}>Shh, no le digás a nadie. En la app ves su wishlist, siempre actualizada.</Text>
      <Section style={{ margin: "28px 0 36px" }}>
        <Button href={groupUrl} style={styles.button}>
          Abrir la app
        </Button>
      </Section>
      <Section style={{ borderTop: `1px solid ${colors.line}`, paddingTop: "16px" }}>
        <Text style={styles.label}>{groupName}</Text>
        <Text style={styles.soft}>Cuándo: {when}</Text>
        {place && <Text style={styles.soft}>Dónde: {place}</Text>}
        <Text style={styles.soft}>Presupuesto: {budget}</Text>
      </Section>
      <Text style={{ ...styles.soft, marginTop: "16px" }}>
        Va adjunto el evento para tu calendario. El día del intercambio, quien organiza destapa todo en la app.
      </Text>
    </BaseEmail>
  );
}

export default TeToco;
