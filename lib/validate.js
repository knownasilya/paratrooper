import Joi from 'joi';

const schema = Joi.object().keys({
  appUrl: Joi.string().regex(/\./).required(),
  appName: Joi.string().required(),
  cloneUrl: Joi.string().hostname().required(),
  branch: Joi.string().required(),
  upstreamPort: Joi.number().positive().integer().greater(0)
});

export default function validate(data, callback) {
  var options = {
    allowUnknown: true
  };

  Joi.validate(data, schema, options, callback);
}
