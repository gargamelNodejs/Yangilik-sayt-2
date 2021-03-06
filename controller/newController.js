const NewsModel = require("../models/news");
const callback = require("../config/callback");
const path = require("path");
const fs = require("fs");

exports.createData = async (req, res, next) => {
  const {
    NAME_UZ,
    NAME_RU,
    NAME_EN,
    DESCRIPTION_UZ,
    DESCRIPTION_RU,
    DESCRIPTION_EN,
    SITATA_UZ,
    SITATA_RU,
    SITATA_EN,
    TELEGRAM,
    FACEBOOK,
    INSTAGRAM,
    AUTHOR,
    STATUS,
  } = req.body;

  // Rasmlarni massivda jonatish uchun
  const files = req.files;
  const filesArray = [];
  for (const iterator of files) {
    const { filename } = iterator;
    filesArray.push(filename);
  }

  let category_IDs = [];
  let category = req.body.CATEGORY_ID;
  for (let item of category) {
    let values = item;
    category_IDs.push(values);
  }

  let tag_IDs = [];
  let tag = req.body.TAG_ID;
  for (let item of tag) {
    let values = item;
    tag_IDs.push(values);
  }

  const result = new NewsModel({
    category_ID: category_IDs,
    tag_ID: tag_IDs,
    images: filesArray,
    name: {
      uz: NAME_UZ,
      ru: NAME_RU,
      en: NAME_EN,
    },
    description: {
      uz: DESCRIPTION_UZ,
      ru: DESCRIPTION_RU,
      en: DESCRIPTION_EN,
    },
    sitata: {
      uz: SITATA_UZ,
      ru: SITATA_RU,
      en: SITATA_EN,
    },
    link: {
      telegram: TELEGRAM,
      facebook: FACEBOOK,
      instagram: INSTAGRAM,
    },
    author_name: AUTHOR,
    status: STATUS,
  });
  await result
    .save()
    .then(() => {
      res.json(callback.createDataSuccess(result));
    })
    .catch((error) => {
      res.json(callback.createDataError(error));
    });
};

exports.getAll = async (req, res, next) => {
  await NewsModel.find().populate(['category_ID', 'tag_ID']).sort({ createdAt: -1 }).exec((error, data) => {
    if (error) res.json(callback.getAllDataError(error));
    else {
      res.json(callback.getAllDataSuccess(data));
    }
  });
};

exports.getOne = async (req, res, next) => {




  await NewsModel.findById(req.params.id).populate(['category_ID', 'tag_ID']).exec(async (error, data) => {
    if (error) res.json(callback.getOneDataError(error));
    else {


      const updateView = await NewsModel.findByIdAndUpdate(req.params.id)
      updateView.view = updateView.view += 1
      updateView.save()





      res.json(callback.getOneDataSuccess(data));
    }
  });



};

exports.updateData = async (req, res, next) => {
  // body ni olish
  const { check } = req.body;

  const { id } = req.params;

  // malumotni saqlash
  async function saveData(parametr) {
    await parametr
      .save()
      .then(() => {
        res.json(callback.createDataSuccess(parametr));
      })
      .catch((error) => {
        res.json(callback.createDataError(error));
      });
  }

  if (!check) {
    res.json(callback.checkError());
  }
  else if (check == "rasm_tahrirlash") {
    // eski rasmni ochirish
    const result = await NewsModel.findById({ _id: id }).select("images");
    const IMAGES = result.images; // []
    for (const image of IMAGES) {
      const pathFile = path.join(__dirname, "../public/news/" + image);
      fs.unlink(pathFile, function (error) {
        if (error) {
          console.log("Error on removing files");
        }
        console.log("Success on removing files");
      });
    }

    // Yangi rasmni tahrirlash
    const files = req.files;
    const filesArray = [];
    for (const iterator of files) {
      const { filename } = iterator;
      filesArray.push(filename);
    }
    const updateImage = await NewsModel.findByIdAndUpdate({ _id: id });
    updateImage.images = filesArray;
    saveData(updateImage);
  } else {
    await NewsModel.findByIdAndUpdate({ _id: id }).exec((error, data) => {
      if (error) res.json(callback.updateOneDataError(error));
      else {
        // kontent qismni tahrirlash
        if (check == "content") {
          const {
            nameuz,
            nameru,
            nameen,
            descriptionuz,
            descriptionru,
            descriptionen,
            sitatauz,
            sitataru,
            sitataen,
          } = req.body;
          data.name.uz = nameuz;
          data.name.ru = nameru;
          data.name.en = nameen;
          data.description.uz = descriptionuz;
          data.description.ru = descriptionru;
          data.description.en = descriptionen;
          data.sitata.uz = sitatauz;
          data.sitata.ru = sitataru;
          data.sitata.en = sitataen;
          saveData(data);
        }

        // faqat kategoruyani tahrrilash
        if (check == "category_tag") {
          const tag_ID = [];
          for (const item of req.body.tag_ID) {
            const values = item;
            tag_ID.push(values);
          }

          const category_ID = [];
          for (const item of req.body.category_ID) {
            const values = item;
            category_ID.push(values);
          }

          data.category_ID = category_ID;
          data.tag_ID = tag_ID;
          saveData(data);
        }


        // faqat like ni tahrrilash
        if (check == "like") {
          data.like = data.like += 1;
          saveData(data);
        }

        // faqat dislike ni tahrrilash
        if (check == "dislike") {
          data.dislike = data.dislike += 1;
          saveData(data);
        }
      }
    });
  }
};

exports.deleteNews = async (req, res, next) => {
  const { id } = req.params;
  const result = await NewsModel.findById({ _id: id }).select("images");
  const IMAGES = result.images; // []
  for (const image of IMAGES) {
    const pathFile = path.join(__dirname, "../public/news/" + image);
    fs.unlink(pathFile, function (error) {
      if (error) {
        console.log("Error on removing files");
      }
      console.log("Success on removing files");
    });
  }
  await NewsModel.findByIdAndDelete({ _id: id });
  res.json(callback.deleteOneDataSuccess());
};
