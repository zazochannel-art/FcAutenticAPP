import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { layout } from "../constants/theme";

// Bara de sus plutește peste pagină, ca aceasta să poată derula pe dedesubt.
// Conținutul derulabil trebuie deci să lase el însuși spațiu la început, altfel
// primul card pornește ascuns sub logo.
//
// Marginea de siguranță nu poate sta într-o constantă de stil: e zero pe
// telefoanele fără crestătură și trece de 50 pe cele cu, iar `StyleSheet` se
// construiește o singură dată, la încărcarea modulului.
// Pe desktop ecranele stau în altă carcasă, cu antetul ei; acolo nu există bara
// plutitoare, deci nu e nimic de ocolit și rămâne spațiul propriu al ecranului.
export function useTopClearance() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  if (width >= 768) return null;
  return { paddingTop: insets.top + layout.topBarClearance };
}
