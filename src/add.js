import * as yup from 'yup';

yup.setLocale({
  mixed: {
    notOneOf: 'Duplication Error',
  },
  string: {
    url: 'Nonvalid URL Error',
  },
});

const validateURL = async (url, parsedLinks) => {
  const schema = yup
    .string()
    .url()
    .notOneOf(parsedLinks)
    .required();
  return schema.validate(url);
};
