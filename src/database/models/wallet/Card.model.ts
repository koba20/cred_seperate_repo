import { Schema, model } from "mongoose";
import paginate, { Pagination } from "../../plugins/paginate.plugin";
import toJSON from "../../plugins/toJson.plugin";
import { TokenizedCard } from "../../../../index";
import { CARD_STATUS } from "../../../../config/constants";

const cardSchema = new Schema<TokenizedCard>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  customer: String,
  cardToken: String,

  cardTransactionRef: String,
  cardFirst6: String,
  cardType: String,
  cardRef: String,

  cardLast4: String,
  cardBrand: String,
  currency: String,
  exp: String,

  hash: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    required: true,
    enum: Object.keys(CARD_STATUS),
    default: CARD_STATUS.INACTIVE,
  },
});

// add plugin that converts mongoose to json
cardSchema.plugin(toJSON);
cardSchema.plugin(paginate);

/**
 * @typedef TokenizedCard
 */
const TokenizedCard: Pagination<TokenizedCard> = model<
  TokenizedCard,
  Pagination<TokenizedCard>
>("Card", cardSchema);

export default TokenizedCard;
