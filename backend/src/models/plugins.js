// Applied to every schema so API responses look like { id, ...fields }
// instead of Mongo's default { _id, __v, ...fields }.
function cleanJson(schema) {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      return ret;
    },
  });
}

module.exports = { cleanJson };
